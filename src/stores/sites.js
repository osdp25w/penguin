import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { SiteSchema } from '@/types/site';
import { z } from 'zod';
import { http } from '@/lib/api';

const SiteListSchema = z.array(SiteSchema);

const mapKoalaLocationToSite = (raw, index) => {
  if (!raw) return null;

  const toNumber = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  };

  const lat = toNumber(raw.latitude);
  const lng = toNumber(raw.longitude);
  if (lat == null || lng == null) return null;

  const candidate = {
    id: String(raw.id ?? `location-${index}`),
    name: String(raw.name ?? `場域 ${index + 1}`),
    region: lat <= 23.5 ? 'taitung' : 'hualien',
    location: { lat, lng },
    status: 'active',
    brand: index % 2 === 0 ? 'huali' : 'shunqi',
    vehicleCount: 0,
    availableCount: 0,
    batteryLevels: { high: 0, medium: 0, low: 0 },
    createdAt: String(raw.created_at ?? new Date().toISOString()),
    updatedAt: String(raw.updated_at ?? raw.created_at ?? new Date().toISOString()),
  };

  const parsed = SiteSchema.safeParse(candidate);
  if (!parsed.success) {
    console.warn('[Sites] Skipping invalid location payload', parsed.error.format());
    return null;
  }

  return parsed.data;
};

export const useSites = defineStore('sites', () => {
  const list = ref([]);
  const selected = ref();
  const loading = ref(false);
  const error = ref(null);

  const filters = ref({
    region: 'hualien',
    brands: [],
    statuses: [],
    batteryRange: [0, 100],
  });

  const filteredSites = computed(() => {
    return list.value.filter((site) => {
      if (site.region !== filters.value.region) return false;
      if (filters.value.brands.length > 0 && !filters.value.brands.includes(site.brand)) return false;
      if (filters.value.statuses.length > 0 && !filters.value.statuses.includes(site.status)) return false;

      const avgBattery = site.vehicleCount > 0
        ? ((site.batteryLevels.high * 85 + site.batteryLevels.medium * 50 + site.batteryLevels.low * 15) / site.vehicleCount)
        : 0;

      return avgBattery >= filters.value.batteryRange[0] && avgBattery <= filters.value.batteryRange[1];
    });
  });

  const fetchSites = async () => {
    loading.value = true;
    error.value = null;

    try {
      console.log('[Sites] Fetching active locations from Koala API');
      const response = await http.get('/api/location/locations/');
      const rawList = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.results)
          ? response.results
          : Array.isArray(response)
            ? response
            : [];

      const mapped = rawList
        .map((item, index) => mapKoalaLocationToSite(item, index))
        .filter((site) => Boolean(site));

      if (mapped.length === 0) {
        throw new Error('No active locations returned from Koala API');
      }

      list.value = mapped;
      if (!selected.value && mapped.length > 0) {
        selected.value = mapped[0];
      }
      console.log('[Sites] Loaded', mapped.length, 'locations from API');
    } catch (err) {
      console.warn('[Sites] Falling back to demo sites due to error:', err);
      try {
        const mod = await import('@/mocks/handlers/sites');
        const sites = mod?.getDemoSites ? mod.getDemoSites(filters.value.region) : [];
        list.value = sites;
        if (!selected.value && sites.length > 0) {
          selected.value = sites[0];
        }
      } catch (mockErr) {
        console.error('[Sites] Failed to load demo sites:', mockErr);
        error.value = '站點載入失敗';
        list.value = [];
      }
    } finally {
      loading.value = false;
    }
  };

  const selectSite = (site) => {
    selected.value = site;
  };

  const setBrandFilter = (brands) => {
    filters.value = {
      ...filters.value,
      brands,
    };
  };

  const setRegion = (region) => {
    filters.value = {
      ...filters.value,
      region,
    };
  };

  const fetchSitesPaged = async (params) => {
    loading.value = true;
    error.value = null;
    const limit = params?.limit ?? 20;
    const offset = params?.offset ?? 0;

    console.log('[Sites] Fetching paged sites:', { limit, offset, keyword: params?.keyword });

    try {
      if (list.value.length === 0) {
        await fetchSites();
      }

      let all = [...list.value];
      if (params?.keyword) {
        const kw = params.keyword.toLowerCase();
        all = all.filter((s) => s.name.toLowerCase().includes(kw));
        console.log('[Sites] Filtered by keyword "' + params.keyword + '":', all.length, 'results');
      }

      const total = all.length;
      const data = all.slice(offset, offset + limit);

      return { data, total };
    } catch (e) {
      console.error('[Sites] Failed to fetch paged sites:', e);
      error.value = '載入場域失敗';
      return { data: [], total: 0 };
    } finally {
      loading.value = false;
    }
  };

  const createSite = async (payload) => {
    try {
      console.log('[Sites] Creating new site via API:', payload);
      const body = {
        name: payload.name,
        latitude: payload.lat,
        longitude: payload.lon,
      };

      const response = await http.post('/api/location/locations/', body);
      const raw = response?.data ?? response;
      const mapped = mapKoalaLocationToSite(raw, list.value.length) ?? {
        id: String(raw?.id ?? `location-${Date.now()}`),
        name: payload.name,
        region: payload.lat <= 23.5 ? 'taitung' : 'hualien',
        location: { lat: payload.lat, lng: payload.lon },
        status: 'active',
        brand: 'huali',
        vehicleCount: 0,
        availableCount: 0,
        batteryLevels: { high: 0, medium: 0, low: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      list.value = [mapped, ...list.value];
      console.log('[Sites] Site created successfully:', mapped.id);
      return mapped;
    } catch (e) {
      console.error('[Sites] Failed to create site:', e);
      throw new Error('新增場域失敗');
    }
  };

  const updateSite = async (id, patch) => {
    try {
      console.log('[Sites] Updating site:', id, patch);

      const idx = list.value.findIndex((s) => s.id === id);
      if (idx === -1) {
        throw new Error(`Site with ID ${id} not found`);
      }

      const payload = {};
      if (patch.name != null) payload.name = patch.name;
      if (patch.location && typeof patch.location.lat === 'number') payload.latitude = patch.location.lat;
      if (patch.location && typeof patch.location.lng === 'number') payload.longitude = patch.location.lng;

      if (Object.keys(payload).length > 0) {
        await http.patch(`/api/location/locations/${encodeURIComponent(id)}/`, payload);
      }

      const updatedSite = {
        ...list.value[idx],
        ...patch,
        location: patch.location ?? list.value[idx].location,
        updatedAt: new Date().toISOString(),
      };

      list.value[idx] = updatedSite;
      console.log('[Sites] Site updated successfully:', id);
      return updatedSite;
    } catch (e) {
      console.error('[Sites] Failed to update site:', e);
      throw new Error('更新場域失敗');
    }
  };

  const deleteSite = async (id) => {
    try {
      console.log('[Sites] Deleting site:', id);

      await http.del(`/api/location/locations/${encodeURIComponent(id)}/`);

      const originalLength = list.value.length;
      list.value = list.value.filter((s) => s.id !== id);

      if (list.value.length === originalLength) {
        console.warn('[Sites] Deleted via API but local cache did not contain site, refreshing list');
        await fetchSites();
      }

      console.log('[Sites] Site deleted successfully:', id);
    } catch (e) {
      console.error('[Sites] Failed to delete site:', e);
      throw new Error('刪除場域失敗');
    }
  };

  return {
    list,
    selected,
    loading,
    error,
    filters,
    filteredSites,
    fetchSites,
    selectSite,
    setBrandFilter,
    setRegion,
    fetchSitesPaged,
    createSite,
    updateSite,
    deleteSite,
  };
});

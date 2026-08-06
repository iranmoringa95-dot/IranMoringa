'use client';

import { useState, useMemo } from 'react';
import { PROVINCES_DATASET, Province, City } from '@/lib/localization/provinces';

interface ProvinceCitySelectProps {
  selectedProvince: string;
  selectedCity: string;
  onProvinceChange: (provinceName: string) => void;
  onCityChange: (cityName: string) => void;
}

export function ProvinceCitySelect({
  selectedProvince,
  selectedCity,
  onProvinceChange,
  onCityChange,
}: ProvinceCitySelectProps) {
  const currentProvince = useMemo(() => {
    return PROVINCES_DATASET.find((p) => p.name_fa === selectedProvince) || PROVINCES_DATASET[0];
  }, [selectedProvince]);

  const availableCities = currentProvince ? currentProvince.cities : [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">استان</label>
        <select
          value={selectedProvince}
          onChange={(e) => {
            const newProvName = e.target.value;
            onProvinceChange(newProvName);
            const foundProv = PROVINCES_DATASET.find((p) => p.name_fa === newProvName);
            if (foundProv && foundProv.cities.length > 0) {
              onCityChange(foundProv.cities[0].name_fa);
            }
          }}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
        >
          {PROVINCES_DATASET.map((p) => (
            <option key={p.id} value={p.name_fa}>
              {p.name_fa}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">شهر</label>
        <select
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
        >
          {availableCities.map((c) => (
            <option key={c.id} value={c.name_fa}>
              {c.name_fa}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

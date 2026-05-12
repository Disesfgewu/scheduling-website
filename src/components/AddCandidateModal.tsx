'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Plus, Phone, Globe, Clock, Loader2, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useUIStore } from '@/store/uiStore';
import { useTripStore } from '@/store/tripStore';
import { CATEGORY_CONFIG, PRICE_LEVEL_LABELS, type EventCategory } from '@/types';
import { searchPlaces, type PlaceSearchResult } from '@/lib/nominatim';

interface Props {
  tripId: string;
}

const defaultForm = {
  name: '',
  address: '',
  phone: '',
  website: '',
  openingHours: '',
  priceLevel: '' as '' | '1' | '2' | '3' | '4',
  priceNote: '',
  category: 'culture' as EventCategory,
  notes: '',
};

export function AddCandidateModal({ tripId }: Props) {
  const { isAddCandidateOpen, closeAddCandidate } = useUIStore();
  const { addCandidate } = useTripStore();

  const [step, setStep] = useState<'search' | 'detail'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsSearching(true);
    try {
      const results = await searchPlaces(q, abortRef.current.signal);
      setSearchResults(results);
    } catch {
      // aborted or failed silently
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(searchQuery), 500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, handleSearch]);

  const handleSelectPlace = (place: PlaceSearchResult) => {
    setSelectedPlace(place);
    setForm((prev) => ({ ...prev, name: place.name, address: place.address }));
    setStep('detail');
  };

  const handleManualEntry = () => {
    setSelectedPlace(null);
    setForm({ ...defaultForm, name: searchQuery });
    setStep('detail');
  };

  const handleSave = async () => {
    if (!form.name) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 200));
    await addCandidate(tripId, {
      name: form.name,
      address: form.address || undefined,
      phone: form.phone || undefined,
      website: form.website || undefined,
      openingHours: form.openingHours || undefined,
      priceLevel: form.priceLevel ? (Number(form.priceLevel) as 1 | 2 | 3 | 4) : undefined,
      priceNote: form.priceNote || undefined,
      category: form.category,
      notes: form.notes || undefined,
      // 名稱和地址用使用者最終填寫的版本（可能已修改），座標保留搜尋結果的精準值
      location: selectedPlace
        ? { name: form.name || selectedPlace.name, address: form.address || selectedPlace.address, lat: selectedPlace.lat, lng: selectedPlace.lng }
        : form.address
        ? { name: form.name, address: form.address, lat: 35.6762, lng: 139.6503 }
        : undefined,
    });
    setIsSaving(false);
    handleClose();
  };

  const handleClose = () => {
    abortRef.current?.abort();
    closeAddCandidate();
    setTimeout(() => {
      setStep('search');
      setSearchQuery('');
      setSearchResults([]);
      setSelectedPlace(null);
      setForm(defaultForm);
    }, 300);
  };

  const setField = <K extends keyof typeof defaultForm>(k: K, v: (typeof defaultForm)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={isAddCandidateOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Plus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            新增候選地點
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'search' ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="space-y-4"
            >
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <Input
                  autoFocus
                  placeholder="搜尋餐廳、景點、咖啡廳..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden max-h-72 overflow-y-auto">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectPlace(r)}
                      className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border/50 last:border-0 flex items-start gap-3"
                    >
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{r.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery && !isSearching && searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  未找到相符結果
                </p>
              )}

              {/* Manual entry */}
              <div className="pt-1">
                <Button
                  variant="outline"
                  className="w-full gap-2 border-dashed"
                  onClick={handleManualEntry}
                >
                  <Plus className="h-4 w-4" />
                  手動輸入地點資訊
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.form
              key="detail"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
              className="space-y-4"
            >
              {/* Source badge + back button */}
              <div className="flex items-center justify-between">
                {selectedPlace ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span>從 OpenStreetMap 搜尋·所有欄位均可修改</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Plus className="h-3 w-3" />
                    <span>手動輸入</span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setStep('search')}
                >
                  <X className="h-3 w-3" />
                  重新搜尋
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">名稱 *</Label>
                <Input id="name" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">地址</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="輸入地址"
                    value={form.address}
                    onChange={(e) => setField('address', e.target.value)}
                    className="pl-9"
                  />
                </div>
                {selectedPlace && (
                  <p className="text-[11px] text-muted-foreground pl-1">
                    座標已鎖定（{selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}）
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">電話</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" placeholder="+81-3-..." value={form.phone}
                      onChange={(e) => setField('phone', e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="website">網站</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="website" placeholder="https://..." value={form.website}
                      onChange={(e) => setField('website', e.target.value)} className="pl-9" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="hours">營業時間</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="hours" placeholder="09:00–18:00" value={form.openingHours}
                      onChange={(e) => setField('openingHours', e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>消費等級</Label>
                  <Select value={form.priceLevel} onValueChange={(v) => setField('priceLevel', v as typeof form.priceLevel)}>
                    <SelectTrigger><SelectValue placeholder="選擇..." /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((l) => (
                        <SelectItem key={l} value={String(l)}>{PRICE_LEVEL_LABELS[l]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priceNote">價格備註</Label>
                <Input id="priceNote" placeholder="例：套餐約 ¥2,000" value={form.priceNote}
                  onChange={(e) => setField('priceNote', e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>類別</Label>
                <Select value={form.category} onValueChange={(v) => setField('category', v as EventCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG[EventCategory]][]).map(([k, c]) => (
                      <SelectItem key={k} value={k}>
                        <span className="flex items-center gap-2">{c.icon} {c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">備註</Label>
                <Textarea id="notes" placeholder="補充說明、推薦理由..." value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)} rows={2} />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setStep('search')}>
                  ← 返回搜尋
                </Button>
                <Button type="submit" disabled={isSaving || !form.name}>
                  {isSaving ? '儲存中...' : '加入候選清單'}
                </Button>
              </DialogFooter>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Upload, ImageOff, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useTripStore } from '@/store/tripStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const EMOJI_OPTIONS = ['🗺️', '🗼', '🏯', '✈️', '🌏', '🏖️', '🏔️', '🌆', '🎌', '🇰🇷', '🇯🇵', '🌸', '🍜', '🎭'];

const PRESET_IMAGES = [
  { label: '東京', url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&auto=format&fit=crop&q=80' },
  { label: '京都', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&auto=format&fit=crop&q=80' },
  { label: '首爾', url: 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&auto=format&fit=crop&q=80' },
  { label: '巴黎', url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&auto=format&fit=crop&q=80' },
  { label: '紐約', url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800&auto=format&fit=crop&q=80' },
  { label: '峇里島', url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&auto=format&fit=crop&q=80' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const defaultForm = {
  title: '',
  description: '',
  location: '',
  country: '',
  startDate: '',
  endDate: '',
  emoji: '🗺️',
  coverImage: undefined as string | undefined,
};

export function CreateTripModal({ open, onClose }: Props) {
  const router = useRouter();
  const { addTrip } = useTripStore();
  const { user } = useAuthStore();
  const [form, setForm] = useState(defaultForm);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setField = <K extends keyof typeof defaultForm>(k: K, v: (typeof defaultForm)[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadPreview(dataUrl);
      setField('coverImage', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (url: string) => {
    setUploadPreview(null);
    setField('coverImage', url);
  };

  const handleNoImage = () => {
    setUploadPreview(null);
    setField('coverImage', undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate || !form.endDate) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    const trip = await addTrip({
      title: form.title,
      description: form.description,
      location: form.location,
      country: form.country,
      startDate: form.startDate,
      endDate: form.endDate,
      emoji: form.emoji,
      coverImage: form.coverImage,
      owner: user ?? undefined,
    });
    setIsSaving(false);
    handleClose();
    router.push(`/trips/${trip.id}`);
  };

  const handleClose = () => {
    setForm(defaultForm);
    setUploadPreview(null);
    onClose();
  };

  const currentImage = uploadPreview ?? form.coverImage;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{form.emoji}</span>
            建立新行程
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji */}
          <div className="space-y-1.5">
            <Label>行程 Emoji</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} type="button" onClick={() => setField('emoji', e)}
                  className={cn(
                    'w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95',
                    form.emoji === e ? 'bg-primary/10 ring-2 ring-primary ring-offset-1' : 'bg-muted hover:bg-accent',
                  )}
                >{e}</button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="trip-title">行程名稱 *</Label>
            <Input id="trip-title" placeholder="例：東京春日冒險" value={form.title}
              onChange={(e) => setField('title', e.target.value)} required autoFocus />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>城市</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="東京" value={form.location}
                  onChange={(e) => setField('location', e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>國家</Label>
              <Input placeholder="日本" value={form.country}
                onChange={(e) => setField('country', e.target.value)} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="trip-start">出發日期 *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="trip-start" type="date" value={form.startDate}
                  onChange={(e) => setField('startDate', e.target.value)} className="pl-9" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="trip-end">返回日期 *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="trip-end" type="date" value={form.endDate} min={form.startDate}
                  onChange={(e) => setField('endDate', e.target.value)} className="pl-9" required />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>簡介（選填）</Label>
            <Textarea placeholder="描述這次旅行的目的、主題..." value={form.description}
              onChange={(e) => setField('description', e.target.value)} rows={2} />
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <Label>封面圖片</Label>

            {/* Preview */}
            {currentImage && (
              <div className="relative h-28 rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentImage} alt="封面預覽" className="w-full h-full object-cover" />
                <button type="button" onClick={handleNoImage}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 h-9 rounded-xl border text-sm font-medium transition-colors',
                  'border-dashed border-border hover:border-primary hover:text-primary hover:bg-primary/5',
                )}>
                <Upload className="h-4 w-4" />
                上傳圖片
              </button>
              <button type="button" onClick={handleNoImage}
                className={cn(
                  'flex items-center justify-center gap-1.5 px-3 h-9 rounded-xl border text-sm transition-colors',
                  !currentImage ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted',
                )}>
                <ImageOff className="h-4 w-4" />
                無圖片
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Preset images */}
            <div className="grid grid-cols-3 gap-2">
              {PRESET_IMAGES.map((img) => (
                <button key={img.url} type="button" onClick={() => handleSelectPreset(img.url)}
                  className={cn(
                    'relative h-14 rounded-xl overflow-hidden transition-all hover:opacity-90 active:scale-95',
                    form.coverImage === img.url && !uploadPreview ? 'ring-2 ring-primary ring-offset-1' : '',
                  )}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-end justify-start p-1">
                    <span className="text-white text-[10px] font-medium">{img.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>取消</Button>
            <Button type="submit" disabled={isSaving || !form.title || !form.startDate || !form.endDate}>
              {isSaving ? '建立中...' : '建立行程'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

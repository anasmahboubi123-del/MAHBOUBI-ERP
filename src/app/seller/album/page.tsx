// app/seller/album/page.tsx
import AlbumSection from '@/components/seller/AlbumSection';
import { fetchAlbumItems } from '@/lib/supabase-seller';

export const dynamic = 'force-dynamic';

export default async function AlbumPage() {
  const items = await fetchAlbumItems();

  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AlbumSection items={items} loading={false} />
      </div>
    </div>
  );
}
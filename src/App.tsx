import { useState, useCallback } from 'react';
import { Header, type PageId } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/components/HomePage';
import { CataloguePage } from '@/components/CataloguePage';
import { BasketPage } from '@/components/BasketPage';
import { ComparePage } from '@/components/ComparePage';
import { BestDealPage } from '@/components/BestDealPage';
import { TinyFishPage } from '@/components/TinyFishPage';
import { MultiRetailerSearchPage } from '@/components/MultiRetailerSearchPage';
import { GroupBuysPage } from '@/components/GroupBuysPage';
import { CampaignDetailPage } from '@/components/CampaignDetailPage';
import { CreateCampaignPage } from '@/components/CreateCampaignPage';
import { MyOrdersPage } from '@/components/MyOrdersPage';
import { SOCIETIES, type CategoryId, type RetailerId } from '@/data/catalog';
import { type LiveExtraction, type MultiRetailerSearch } from '@/data/liveProducts';

function App() {
  const [page, setPage] = useState<PageId>('home');
  const [society, setSociety] = useState<string>(SOCIETIES[0]);
  const [residentName, setResidentName] = useState<string>(() => {
    return localStorage.getItem('sb_resident_name') || '';
  });
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [preferredRetailer, setPreferredRetailer] = useState<RetailerId>('freshkart');
  const [families, setFamilies] = useState(12);
  const [liveExtraction, setLiveExtraction] = useState<LiveExtraction | null>(null);
  const [multiSearch, setMultiSearch] = useState<MultiRetailerSearch | null>(null);

  const basketCount = Object.values(basket).reduce((s, q) => s + q, 0);

  const updateResidentName = useCallback((name: string) => {
    setResidentName(name);
    try {
      localStorage.setItem('sb_resident_name', name);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const addToBasket = useCallback((productId: string, _retailerId: RetailerId) => {
    void _retailerId;
    setBasket((b) => ({ ...b, [productId]: (b[productId] ?? 0) + 1 }));
  }, []);

  const inc = useCallback((productId: string) => {
    setBasket((b) => ({ ...b, [productId]: (b[productId] ?? 0) + 1 }));
  }, []);

  const dec = useCallback((productId: string) => {
    setBasket((b) => {
      const next = (b[productId] ?? 0) - 1;
      const copy = { ...b };
      if (next <= 0) delete copy[productId];
      else copy[productId] = next;
      return copy;
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setBasket((b) => {
      const copy = { ...b };
      delete copy[productId];
      return copy;
    });
  }, []);

  const clearBasket = useCallback(() => setBasket({}), []);

  const resetDemo = useCallback(() => {
    setBasket({});
    setSearch('');
    setActiveCategory('all');
    setPreferredRetailer('freshkart');
    setFamilies(12);
    setSociety(SOCIETIES[0]);
    setPage('home');
  }, []);

  const pickCategory = useCallback((c: CategoryId) => {
    setActiveCategory(c);
    setPage('catalogue');
  }, []);

  const selectCampaign = useCallback((id: string) => {
    setSelectedCampaignId(id);
    setPage('campaigndetail');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-neon-black">
      <Header
        page={page}
        setPage={setPage}
        society={society}
        setSociety={setSociety}
        societies={SOCIETIES}
        residentName={residentName}
        setResidentName={updateResidentName}
        basketCount={basketCount}
        search={search}
        setSearch={setSearch}
        onReset={resetDemo}
      />

      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            society={society}
            setSociety={setSociety}
            societies={SOCIETIES}
            search={search}
            setSearch={setSearch}
            setPage={setPage}
            basket={basket}
            basketCount={basketCount}
            families={families}
            onPickCategory={pickCategory}
            residentName={residentName}
            onSelectCampaign={selectCampaign}
          />
        )}
        {page === 'catalogue' && (
          <CataloguePage
            search={search}
            setSearch={setSearch}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            basket={basket}
            onAdd={addToBasket}
            onInc={inc}
            onDec={dec}
            preferredRetailer={preferredRetailer}
            society={society}
            residentName={residentName}
            onSelectCampaign={selectCampaign}
            setPage={setPage}
          />
        )}
        {page === 'basket' && (
          <BasketPage
            basket={basket}
            onInc={inc}
            onDec={dec}
            onRemove={removeItem}
            onClear={clearBasket}
            setPage={setPage}
            preferredRetailer={preferredRetailer}
            setPreferredRetailer={setPreferredRetailer}
          />
        )}
        {page === 'groupbuys' && (
          <GroupBuysPage
            society={society}
            residentName={residentName}
            setPage={setPage}
            onSelectCampaign={selectCampaign}
          />
        )}
        {page === 'createcampaign' && (
          <CreateCampaignPage
            society={society}
            residentName={residentName}
            onBack={() => setPage('groupbuys')}
            onCreated={(id) => selectCampaign(id)}
          />
        )}
        {page === 'campaigndetail' && selectedCampaignId && (
          <CampaignDetailPage
            campaignId={selectedCampaignId}
            residentName={residentName}
            onBack={() => setPage('groupbuys')}
          />
        )}
        {page === 'myorders' && (
          <MyOrdersPage
            basket={basket}
            residentName={residentName}
            society={society}
            setPage={setPage}
            preferredRetailer={preferredRetailer}
            onSelectCampaign={selectCampaign}
          />
        )}
        {page === 'compare' && (
          <ComparePage basket={basket} setPage={setPage} liveExtraction={liveExtraction} />
        )}
        {page === 'bestdeal' && (
          <BestDealPage
            basket={basket}
            setPage={setPage}
            families={families}
            setFamilies={setFamilies}
            liveExtraction={liveExtraction}
          />
        )}
        {page === 'tinyfish' && (
          <TinyFishPage liveExtraction={liveExtraction} setLiveExtraction={setLiveExtraction} />
        )}
        {page === 'multicompare' && (
          <MultiRetailerSearchPage
            multiSearch={multiSearch}
            setMultiSearch={setMultiSearch}
            setPage={setPage}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;

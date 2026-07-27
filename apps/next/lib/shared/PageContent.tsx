import { AmbientColor } from '@/components/decorations/ambient-color';
import DynamicZoneManager, {
  type DynamicZoneEntry,
} from '@/components/dynamic-zone/manager';

// Pages, products and articles all reach this with a dynamic zone, so it takes
// the two fields it actually reads rather than one of those content types.
type PageContentProps = {
  pageData: {
    dynamic_zone?: DynamicZoneEntry[] | null;
    locale?: string | null;
  } | null;
};

export default function PageContent({ pageData }: PageContentProps) {
  const dynamicZone = pageData?.dynamic_zone;
  return (
    <div className="relative overflow-hidden w-full">
      <AmbientColor />
      {dynamicZone && (
        <DynamicZoneManager
          dynamicZone={dynamicZone}
          locale={pageData?.locale ?? ''}
        />
      )}
    </div>
  );
}

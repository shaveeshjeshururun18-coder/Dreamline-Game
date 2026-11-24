import type { ExhibitionVehicleId } from '../game/exhibitionComplex';
import type { CatalogueVehicleId } from '../game/vehicleCatalogue';

import previewCamperVan from '../assets/images/preview_camper_van_1795345911452.jpg';
import previewSafariJeep from '../assets/images/preview_safari_jeep_1795345911241.jpg';
import previewRuralBus from '../assets/images/preview_rural_bus_1795345910675.jpg';
import previewCommuterBike from '../assets/images/preview_commuter_bike_1795345910808.jpg';
import previewSkateboard from '../assets/images/preview_skateboard_1795345911375.jpg';
import previewSovereignShip from '../assets/images/preview_sovereign_ship_1795345911444.jpg';
import previewBambooCatamaran from '../assets/images/preview_bamboo_catamaran_1795345910511.jpg';
import previewTribalOutrigger from '../assets/images/preview_tribal_outrigger_1795345910599.jpg';
import previewCoastalBoat from '../assets/images/preview_coastal_boat_1795345911320.jpg';
import previewLakeRowboat from '../assets/images/preview_lake_rowboat_1795345911078.jpg';
import previewSkyExplorer from '../assets/images/preview_sky_explorer_1795345911478.jpg';
import previewDreamlineTrain from '../assets/images/preview_dreamline_train_1795345910441.jpg';

export type AnyVehiclePreviewId = CatalogueVehicleId | ExhibitionVehicleId;

export const VEHICLE_PREVIEW_IMAGES: Record<AnyVehiclePreviewId, string> = {
  camper_van: previewCamperVan,
  olga_camper: previewCamperVan,
  safari_car: previewSafariJeep,
  rural_bus: previewRuralBus,
  commuter_bicycle: previewCommuterBike,
  cruiser_skateboard: previewSkateboard,
  sovereign_ship: previewSovereignShip,
  bamboo_catamaran: previewBambooCatamaran,
  tribal_outrigger: previewTribalOutrigger,
  coastal_boat: previewCoastalBoat,
  lake_boat: previewLakeRowboat,
  sky_explorer: previewSkyExplorer,
  dreamline_train: previewDreamlineTrain,
  batmobile: '/assets/aistudio/images__13__2a66b595.jpeg',
};

export function getVehiclePreviewImage(id: AnyVehiclePreviewId): string {
  return VEHICLE_PREVIEW_IMAGES[id];
}

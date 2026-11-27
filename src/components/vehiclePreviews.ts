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
  safari_jeep: previewSafariJeep,
  safari_car: previewSafariJeep,
  rural_bus: previewRuralBus,
  commuter_bicycle: previewCommuterBike,
  dirt_bike_49cc:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'><defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#2b180c'/><stop offset='100%' stop-color='#120d0a'/></linearGradient></defs><rect width='320' height='180' fill='url(%23bg)'/><ellipse cx='160' cy='150' rx='112' ry='14' fill='rgba(0,0,0,0.45)'/><circle cx='96' cy='124' r='28' fill='none' stroke='#161618' stroke-width='12' stroke-dasharray='8 4'/><circle cx='96' cy='124' r='18' fill='none' stroke='#ff5900' stroke-width='4'/><circle cx='96' cy='124' r='10' fill='none' stroke='#e2e8f0' stroke-width='2'/><circle cx='226' cy='124' r='28' fill='none' stroke='#161618' stroke-width='12' stroke-dasharray='8 4'/><circle cx='226' cy='124' r='18' fill='none' stroke='#ff5900' stroke-width='4'/><circle cx='226' cy='124' r='10' fill='none' stroke='#e2e8f0' stroke-width='2'/><line x1='96' y1='124' x2='130' y2='54' stroke='#ff5900' stroke-width='7' stroke-linecap='round'/><line x1='122' y1='50' x2='142' y2='48' stroke='#cc1122' stroke-width='8' stroke-linecap='round'/><path d='M90 80 Q114 70 138 78' fill='none' stroke='#ff5a00' stroke-width='6' stroke-linecap='round'/><polygon points='124,68 176,58 194,78 142,92' fill='#ff5a00' stroke='#ffffff' stroke-width='2'/><path d='M160 72 Q196 78 232 68' fill='none' stroke='#18181b' stroke-width='10' stroke-linecap='round'/><path d='M220 68 L260 64' stroke='#ff5500' stroke-width='7' stroke-linecap='round'/><rect x='144' y='92' width='34' height='24' rx='4' fill='#cfd6de' stroke='#141416' stroke-width='2'/><line x1='174' y1='106' x2='226' y2='124' stroke='#141416' stroke-width='9' stroke-linecap='round'/><text x='18' y='28' font-family='Impact,sans-serif' font-style='italic' font-size='18' fill='#ff6a00'>ORION 49CC</text><text x='18' y='44' font-family='Arial,sans-serif' font-size='10' fill='#fde68a'>2-STROKE PETROL DIRT BIKE</text></svg>`
    ),
  cruiser_skateboard: previewSkateboard,
  sovereign_ship: previewSovereignShip,
  jetski_sport: previewCoastalBoat,
  jetski_perf: previewTribalOutrigger,
  kadalkarai_submarine: previewSovereignShip,
  bamboo_catamaran: previewBambooCatamaran,
  tribal_outrigger: previewTribalOutrigger,
  coastal_boat: previewCoastalBoat,
  ssj_expedition_boat: previewCoastalBoat,
  lake_boat: previewLakeRowboat,
  vtol_aircraft: previewSkyExplorer,
  hover_glider: '/assets/aistudio/download_3b7601ab.jpeg',
  sky_explorer: previewSkyExplorer,
  orange_heli: previewSkyExplorer,
  dreamline_train: previewDreamlineTrain,
  batmobile: '/assets/aistudio/images__13__2a66b595.jpeg',
};

export function getVehiclePreviewImage(id: AnyVehiclePreviewId): string {
  return VEHICLE_PREVIEW_IMAGES[id];
}

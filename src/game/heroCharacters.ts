export type HeroCharacterId =
  | 'steve_harrington'
  | 'iron_man_classic'
  | 'iron_man_advanced'
  | 'hulkbuster'
  | 'batman'
  | 'spider_man'
  | 'superman';

export type HeroOutfitId =
  | 'steve_grey_jacket'
  | 'steve_scoops_ahoy'
  | 'iron_man_mk85'
  | 'iron_man_mk42_gold'
  | 'iron_man_mk50_nano'
  | 'iron_man_stealth_cobalt'
  | 'hulkbuster_mk44'
  | 'hulkbuster_mk48_titan'
  | 'batman_dark_knight'
  | 'batman_armoured_mech'
  | 'spider_classic'
  | 'spider_advanced'
  | 'spider_iron'
  | 'superman_classic'
  | 'superman_solar_black';

export type HeroPreviewAnim = 'idle' | 'run' | 'action' | 'flight_swing' | 'helmet_pose';

export type HeroPowerKind =
  | 'bat_smash'
  | 'repulsor_blast'
  | 'unibeam_barrage'
  | 'seismic_slam'
  | 'grapple_zip'
  | 'web_swing'
  | 'heat_slam';

export type HeroSecondaryKind =
  | 'dodge_roll'
  | 'energy_shield'
  | 'detective_scan'
  | 'spider_sense'
  | 'heavy_defense'
  | 'solar_surge';

export interface HeroStats {
  strength: number;
  speed: number;
  agility: number;
  defence: number;
  mobility: number;
  intelligence: number;
}

export interface HeroOutfitSpec {
  id: HeroOutfitId;
  label: string;
  subtitle: string;
  referenceImage: string;
  primaryColor: string;
  accentColor: string;
}

export interface HeroCharacterSpec {
  id: HeroCharacterId;
  name: string;
  alias: string;
  tagline: string;
  biography: string;
  referenceImage: string;
  defaultOutfitId: HeroOutfitId;
  outfits: readonly HeroOutfitSpec[];
  stats: HeroStats;
  abilities: readonly string[];
  primaryPower: {
    kind: HeroPowerKind;
    label: string;
    keyHint: string;
    cooldownSec: number;
    impactRadius: number;
    impactForce: number;
    damage: number;
  };
  secondaryPower: {
    kind: HeroSecondaryKind;
    label: string;
    keyHint: string;
    durationSec: number;
  };
  mobility: {
    heightMeters: number;
    scaleMultiplier: number;
    walkSpeedMul: number;
    sprintSpeedMul: number;
    jumpMul: number;
    canFly: boolean;
    canHover: boolean;
    canWebSwing: boolean;
    canCapeGlide: boolean;
    canGrapple: boolean;
    hasHelmetToggle: boolean;
    hasIronSpiderArms: boolean;
    hasBatmobileLink: boolean;
    heavyFootsteps: boolean;
  };
  quotes: readonly string[];
}

export const HERO_CHARACTERS: readonly HeroCharacterSpec[] = [
  {
    id: 'steve_harrington',
    name: 'Steve Harrington',
    alias: 'Hawkins Protector',
    tagline: '1980s icon armed with his signature nail-studded baseball bat & quick reflexes.',
    biography:
      'Resourceful, fiercely loyal, and fearless under pressure. Armed with his trusty nail-studded wooden bat, yellow protective gloves, and quick athletic footwork, Steve explores buildings, dodges hazards, and swings straight into action across town or the city.',
    referenceImage: '/assets/aistudio/jdv37mf128a91_13da34ac.jpg',
    defaultOutfitId: 'steve_grey_jacket',
    outfits: [
      {
        id: 'steve_grey_jacket',
        label: 'Grey Jacket & Nail Bat',
        subtitle: 'Light grey zip-up jacket, navy tee, denim jeans, black pack, yellow gloves & nail bat',
        referenceImage: '/assets/aistudio/jdv37mf128a91_13da34ac.jpg',
        primaryColor: '#9ca3af',
        accentColor: '#facc15',
      },
      {
        id: 'steve_scoops_ahoy',
        label: 'Scoops Ahoy Sailor',
        subtitle: 'Navy sailor uniform, red/white striped collar, red neckerchief, white piping & Steve badge',
        referenceImage: '/assets/aistudio/images_e1206703.webp',
        primaryColor: '#1d3b7a',
        accentColor: '#dc2626',
      },
    ],
    stats: {
      strength: 66,
      speed: 78,
      agility: 84,
      defence: 58,
      mobility: 76,
      intelligence: 72,
    },
    abilities: [
      'Nail-Bat Melee Smash (breaks crates, fences, glass & street props)',
      'Fast 1980s Sprint, Dodge & High Athletic Vault',
      'Instant Outfit Swap: Grey Jacket ↔ Scoops Ahoy Uniform',
      'Voluminous animated 80s hair & expressive facial blinking',
    ],
    primaryPower: {
      kind: 'bat_smash',
      label: 'Bat Smash',
      keyHint: 'Q',
      cooldownSec: 0.75,
      impactRadius: 5.5,
      impactForce: 15,
      damage: 45,
    },
    secondaryPower: {
      kind: 'dodge_roll',
      label: 'Quick Dodge',
      keyHint: 'R',
      durationSec: 1.6,
    },
    mobility: {
      heightMeters: 1.8,
      scaleMultiplier: 1.04,
      walkSpeedMul: 1.15,
      sprintSpeedMul: 1.32,
      jumpMul: 1.18,
      canFly: false,
      canHover: false,
      canWebSwing: false,
      canCapeGlide: false,
      canGrapple: false,
      hasHelmetToggle: false,
      hasIronSpiderArms: false,
      hasBatmobileLink: false,
      heavyFootsteps: false,
    },
    quotes: [
      'Always the babysitter, never the hero — alright, let us handle this!',
      'Ahoy ladies and gentlemen! Care to see the skyline?',
      'Keep the hair intact. Rule number one.',
    ],
  },
  {
    id: 'iron_man_classic',
    name: 'Iron Man',
    alias: 'Classic Mark 85 Armour',
    tagline: 'Red-and-gold titanium-gold powered armour with animated faceplate, flight & repulsors.',
    biography:
      'Precision-engineered red and gold exoskeleton powered by a bright triangular chest arc reactor. Features an articulated mechanical faceplate that opens and closes on demand, palm-mounted repulsor emitters, controlled hovering, and an energy barrier.',
    referenceImage: '/assets/aistudio/images__10__e7b3b97b.jpeg',
    defaultOutfitId: 'iron_man_mk85',
    outfits: [
      {
        id: 'iron_man_mk85',
        label: 'Classic Mark 85 Armour',
        subtitle: 'Metallic crimson & burnished gold alloy plates, triangular arc reactor & animated helmet',
        referenceImage: '/assets/aistudio/images__10__e7b3b97b.jpeg',
        primaryColor: '#991b1b',
        accentColor: '#eab308',
      },
      {
        id: 'iron_man_mk42_gold',
        label: 'Mark 42 Prodigal Gold',
        subtitle: 'Inverted champagne-gold primary chassis with deep crimson trim & bright cyan arc reactor',
        referenceImage: '/assets/aistudio/images__10__e7b3b97b.jpeg',
        primaryColor: '#d4a72c',
        accentColor: '#991b1b',
      },
    ],
    stats: {
      strength: 86,
      speed: 92,
      agility: 84,
      defence: 88,
      mobility: 96,
      intelligence: 99,
    },
    abilities: [
      'Twin Palm Repulsor Projection (shatters concrete & glass facades)',
      'Controlled 3D Aerial Flight, Hover & Mid-Air Turning',
      'Animated Mechanical Faceplate Open / Close Sequence',
      'Deployable Cyan Energy Shield & Tactical Diagnostics',
    ],
    primaryPower: {
      kind: 'repulsor_blast',
      label: 'Repulsor Blast',
      keyHint: 'Q',
      cooldownSec: 0.65,
      impactRadius: 8.5,
      impactForce: 26,
      damage: 65,
    },
    secondaryPower: {
      kind: 'energy_shield',
      label: 'Energy Shield',
      keyHint: 'R',
      durationSec: 5.0,
    },
    mobility: {
      heightMeters: 1.92,
      scaleMultiplier: 1.1,
      walkSpeedMul: 1.12,
      sprintSpeedMul: 1.38,
      jumpMul: 1.65,
      canFly: true,
      canHover: true,
      canWebSwing: false,
      canCapeGlide: false,
      canGrapple: false,
      hasHelmetToggle: true,
      hasIronSpiderArms: false,
      hasBatmobileLink: false,
      heavyFootsteps: false,
    },
    quotes: [
      'Arc reactor online at 100%. Flight stabilizers engaged.',
      'Repulsors charged — try not to level the whole block.',
      'Faceplate sealed. Skyline telemetry looks clear.',
    ],
  },
  {
    id: 'iron_man_advanced',
    name: 'Iron Man – Advanced',
    alias: 'Mark 50 Nano Flight Suit',
    tagline: 'Crimson-gold nanotech armour with rear flight stabilizer wings & high-output propulsion.',
    biography:
      'Advanced aerodynamic nanotech evolution of Iron Man featuring four articulated rear flight stabilizer fins, luminous cyan reactor conduits across the chest and forearms, blue-white supersonic thruster glow, and overcharged Unibeam bursts.',
    referenceImage: '/assets/aistudio/images__11__e2409175.jpeg',
    defaultOutfitId: 'iron_man_mk50_nano',
    outfits: [
      {
        id: 'iron_man_mk50_nano',
        label: 'Advanced Nano Flight Suit',
        subtitle: 'Deep crimson nano-plates, 4 rear flight stabilizer blades & cyan energy conduits',
        referenceImage: '/assets/aistudio/images__11__e2409175.jpeg',
        primaryColor: '#b91c1c',
        accentColor: '#38bdf8',
      },
      {
        id: 'iron_man_stealth_cobalt',
        label: 'Mark 50 Stealth Cobalt',
        subtitle: 'Midnight titanium-cobalt stealth plating, silver-gold accents & overcharged plasma wings',
        referenceImage: '/assets/aistudio/images__11__e2409175.jpeg',
        primaryColor: '#1e3a5f',
        accentColor: '#38bdf8',
      },
    ],
    stats: {
      strength: 89,
      speed: 98,
      agility: 92,
      defence: 91,
      mobility: 100,
      intelligence: 99,
    },
    abilities: [
      'Supersonic Nano Flight with 4 Articulated Rear Stabilizer Wings',
      'Overcharged Unibeam & Repulsor Barrage (massive structural destruction)',
      'Dynamic Blue-White Thruster Light & Reactor Illumination',
      'Nano Energy Shield & Tactical Target Lock',
    ],
    primaryPower: {
      kind: 'unibeam_barrage',
      label: 'Unibeam Burst',
      keyHint: 'Q',
      cooldownSec: 0.9,
      impactRadius: 11.5,
      impactForce: 34,
      damage: 85,
    },
    secondaryPower: {
      kind: 'energy_shield',
      label: 'Nano Shield',
      keyHint: 'R',
      durationSec: 5.5,
    },
    mobility: {
      heightMeters: 1.94,
      scaleMultiplier: 1.11,
      walkSpeedMul: 1.18,
      sprintSpeedMul: 1.48,
      jumpMul: 1.85,
      canFly: true,
      canHover: true,
      canWebSwing: false,
      canCapeGlide: false,
      canGrapple: false,
      hasHelmetToggle: true,
      hasIronSpiderArms: false,
      hasBatmobileLink: false,
      heavyFootsteps: false,
    },
    quotes: [
      'Nano flight wings deployed. Breaking through the cloud deck!',
      'Unibeam capacitors at full charge.',
      'All auxiliary energy nodes glowing green.',
    ],
  },
  {
    id: 'hulkbuster',
    name: 'Hulkbuster Armour',
    alias: 'Heavy Exoskeleton Mark 44',
    tagline: 'Colossal industrial red-and-gold heavy mech built for unstoppable seismic impacts.',
    biography:
      'An enormous, intimidating heavy-duty industrial exoskeleton towering far above standard armour. Engineered with massive layered shoulder domes, hydraulic piston legs, circular chest and knee arc reactors, and ground-shattering seismic shockwaves.',
    referenceImage: '/assets/aistudio/images__12__8231bae0.jpeg',
    defaultOutfitId: 'hulkbuster_mk44',
    outfits: [
      {
        id: 'hulkbuster_mk44',
        label: 'Mark 44 Heavy Exoskeleton',
        subtitle: '2.7m colossal crimson & gold hydraulic mech, circular arc reactors & shockwave gauntlets',
        referenceImage: '/assets/aistudio/images__12__8231bae0.jpeg',
        primaryColor: '#7f1d1d',
        accentColor: '#d97706',
      },
      {
        id: 'hulkbuster_mk48_titan',
        label: 'Mark 48 Titanium Siege',
        subtitle: 'Reinforced gunmetal-titanium & burnished gold orbital heavy armour with bright cyan vents',
        referenceImage: '/assets/aistudio/images__12__8231bae0.jpeg',
        primaryColor: '#334155',
        accentColor: '#f59e0b',
      },
    ],
    stats: {
      strength: 100,
      speed: 58,
      agility: 44,
      defence: 100,
      mobility: 68,
      intelligence: 92,
    },
    abilities: [
      'Seismic Ground-Slam (collapses skyscraper tiers & launches cars/debris)',
      'Heavy Industrial Hydraulic Footsteps & Dust Shockwave Landings',
      'Booster-Assisted Heavy Leap & Short Hover Jets',
      'Reinforced Fortress Defence Mode with Full Reactor Glow',
    ],
    primaryPower: {
      kind: 'seismic_slam',
      label: 'Seismic Slam',
      keyHint: 'Q',
      cooldownSec: 1.35,
      impactRadius: 14.5,
      impactForce: 45,
      damage: 115,
    },
    secondaryPower: {
      kind: 'heavy_defense',
      label: 'Fortress Mode',
      keyHint: 'R',
      durationSec: 6.0,
    },
    mobility: {
      heightMeters: 2.75,
      scaleMultiplier: 1.56,
      walkSpeedMul: 0.84,
      sprintSpeedMul: 1.12,
      jumpMul: 1.55,
      canFly: true,
      canHover: true,
      canWebSwing: false,
      canCapeGlide: false,
      canGrapple: false,
      hasHelmetToggle: false,
      hasIronSpiderArms: false,
      hasBatmobileLink: false,
      heavyFootsteps: true,
    },
    quotes: [
      'Veronica heavy exoskeleton stabilized. Hydraulics at maximum pressure.',
      'Seismic gauntlets primed — brace for impact!',
      'Heavy armour plating locked. Nothing gets through this hull.',
    ],
  },
  {
    id: 'batman',
    name: 'Batman',
    alias: 'The Dark Knight',
    tagline: 'Master detective with flowing glide cape, grapple launcher & armoured Batmobile.',
    biography:
      'Peak human martial artist, strategist, and master detective clad in dark charcoal-and-black tactical Kevlar with a sculpted pointed cowl, golden utility belt, multi-panel flowing cape for rooftop gliding, grapple traversal, and direct command of the Batmobile.',
    referenceImage: '/assets/aistudio/images__15__6d47a78a.jpeg',
    defaultOutfitId: 'batman_dark_knight',
    outfits: [
      {
        id: 'batman_dark_knight',
        label: 'Dark Knight Tactical Suit',
        subtitle: 'Sculpted bat-cowl, dark grey chest armour, bat emblem, golden utility belt & wide glide cape',
        referenceImage: '/assets/aistudio/images__15__6d47a78a.jpeg',
        primaryColor: '#1f2937',
        accentColor: '#eab308',
      },
      {
        id: 'batman_armoured_mech',
        label: 'Armoured Gotham Mech Suit',
        subtitle: 'Heavy brushed steel tactical plating, glowing white cowl optics & matte obsidian cape',
        referenceImage: '/assets/aistudio/images__15__6d47a78a.jpeg',
        primaryColor: '#374151',
        accentColor: '#e0f2fe',
      },
    ],
    stats: {
      strength: 76,
      speed: 84,
      agility: 93,
      defence: 82,
      mobility: 90,
      intelligence: 100,
    },
    abilities: [
      'Grapple Gun Zip to Skyscraper Rooftops & Ledges',
      'Wide Flowing Bat-Cape Aerodynamic Rooftop Gliding',
      'Detective Vision Environmental & Structural Weak-Point Scan',
      'Remote Batmobile Summon & Full Armoured Driving Control',
    ],
    primaryPower: {
      kind: 'grapple_zip',
      label: 'Grapple Gun',
      keyHint: 'Q',
      cooldownSec: 1.0,
      impactRadius: 6.5,
      impactForce: 18,
      damage: 45,
    },
    secondaryPower: {
      kind: 'detective_scan',
      label: 'Detective Vision',
      keyHint: 'R',
      durationSec: 6.0,
    },
    mobility: {
      heightMeters: 1.9,
      scaleMultiplier: 1.08,
      walkSpeedMul: 1.18,
      sprintSpeedMul: 1.4,
      jumpMul: 1.45,
      canFly: false,
      canHover: false,
      canWebSwing: false,
      canCapeGlide: true,
      canGrapple: true,
      hasHelmetToggle: false,
      hasIronSpiderArms: false,
      hasBatmobileLink: true,
      heavyFootsteps: false,
    },
    quotes: [
      'Scanning structural stress points across the city grid.',
      'Grapple anchor locked. Moving to high ground.',
      'Batmobile engines primed and standing by.',
    ],
  },
  {
    id: 'spider_man',
    name: 'Spider-Man',
    alias: 'Web-Slinging Hero · 3 Suits',
    tagline: 'Momentum web-swinging, Spider-Sense dodge & 3 switchable suits including Iron Spider.',
    biography:
      'Acrobatic, razor-quick protector of the skyline. Swing dynamically between towering skyscrapers with real pendulum web physics, zip to rooftops, trigger Spider-Sense slow-motion reflexes, and switch seamlessly between Classic, Remastered Advanced, and 4-armed Iron Spider suits.',
    referenceImage: '/assets/aistudio/images__18__0f4c9146.jpeg',
    defaultOutfitId: 'spider_advanced',
    outfits: [
      {
        id: 'spider_classic',
        label: 'Classic Web Suit',
        subtitle: 'Red & deep navy fabric with crisp black web patterns, large white lenses & chest spider',
        referenceImage: '/assets/aistudio/images__17__66c54d82.jpeg',
        primaryColor: '#dc2626',
        accentColor: '#1e3a8a',
      },
      {
        id: 'spider_advanced',
        label: 'Remastered Advanced Suit',
        subtitle: 'Vibrant crimson & cobalt athletic weave with iconic oversized white chest & back spider',
        referenceImage: '/assets/aistudio/images__18__0f4c9146.jpeg',
        primaryColor: '#e11d48',
        accentColor: '#f8fafc',
      },
      {
        id: 'spider_iron',
        label: 'Iron Spider Armour',
        subtitle: 'Metallic red-navy-gold nanotech armour with 4 articulated golden mechanical spider legs',
        referenceImage: '/assets/aistudio/images__19__cb78bf6d.jpeg',
        primaryColor: '#991b1b',
        accentColor: '#f59e0b',
      },
    ],
    stats: {
      strength: 85,
      speed: 94,
      agility: 100,
      defence: 79,
      mobility: 99,
      intelligence: 95,
    },
    abilities: [
      'Momentum Pendulum Web-Swinging Between Skyscrapers',
      'Web-Zip Launch, Web-Shot Impact & Aerial Acrobatics',
      'Spider-Sense Warning Pulse + Slow-Motion Reflex Dodge',
      'Switchable Classic, Remastered Advanced & 4-Armed Iron Spider Suits',
    ],
    primaryPower: {
      kind: 'web_swing',
      label: 'Web-Swing / Shot',
      keyHint: 'Q',
      cooldownSec: 0.45,
      impactRadius: 7.5,
      impactForce: 22,
      damage: 58,
    },
    secondaryPower: {
      kind: 'spider_sense',
      label: 'Spider-Sense',
      keyHint: 'R',
      durationSec: 4.5,
    },
    mobility: {
      heightMeters: 1.82,
      scaleMultiplier: 1.05,
      walkSpeedMul: 1.26,
      sprintSpeedMul: 1.56,
      jumpMul: 2.05,
      canFly: false,
      canHover: false,
      canWebSwing: true,
      canCapeGlide: false,
      canGrapple: true,
      hasHelmetToggle: false,
      hasIronSpiderArms: true,
      hasBatmobileLink: false,
      heavyFootsteps: false,
    },
    quotes: [
      'Nothing beats a sunset web-swing down Fifth Avenue!',
      'Whoa — Spider-Sense is tingling!',
      'Instant-Kill? No thanks — let us stick to awesome aerial tricks.',
    ],
  },
  {
    id: 'superman',
    name: 'Superman',
    alias: 'Man of Steel',
    tagline: 'Supersonic flight, flowing crimson cape & solar shockwave ground-impact power.',
    biography:
      'Iconic crimson-caped guardian powered by the yellow sun. Soars effortlessly above skyscrapers and mountain peaks alike, unleashing solar shockwaves capable of toppling heavy concrete barriers while patrolling the skyline.',
    referenceImage: '/assets/aistudio/images__16__5ecb3395.jpeg',
    defaultOutfitId: 'superman_classic',
    outfits: [
      {
        id: 'superman_classic',
        label: 'Classic Kryptonian Suit',
        subtitle: 'Royal blue suit, golden-red chest S-shield, crimson boots & flowing red cape',
        referenceImage: '/assets/aistudio/images__16__5ecb3395.jpeg',
        primaryColor: '#1d4ed8',
        accentColor: '#dc2626',
      },
      {
        id: 'superman_solar_black',
        label: 'Black Solar Recovery Suit',
        subtitle: 'Jet-black Kryptonian solar-absorption weave, metallic silver S-crest & silver-trimmed obsidian cape',
        referenceImage: '/assets/aistudio/images__16__5ecb3395.jpeg',
        primaryColor: '#111827',
        accentColor: '#e2e8f0',
      },
    ],
    stats: {
      strength: 100,
      speed: 100,
      agility: 90,
      defence: 99,
      mobility: 100,
      intelligence: 88,
    },
    abilities: [
      'Supersonic 3D Flight & High-Altitude Hovering',
      'Solar Shockwave Slam & Heat-Vision Beam Impact',
      'Dynamic Flowing Crimson Cape Physics',
      'Unmatched Aerial Speed Across Every Biome',
    ],
    primaryPower: {
      kind: 'heat_slam',
      label: 'Solar Blast',
      keyHint: 'Q',
      cooldownSec: 0.85,
      impactRadius: 12.0,
      impactForce: 38,
      damage: 95,
    },
    secondaryPower: {
      kind: 'solar_surge',
      label: 'Solar Surge',
      keyHint: 'R',
      durationSec: 5.0,
    },
    mobility: {
      heightMeters: 1.94,
      scaleMultiplier: 1.11,
      walkSpeedMul: 1.22,
      sprintSpeedMul: 1.58,
      jumpMul: 2.15,
      canFly: true,
      canHover: true,
      canWebSwing: false,
      canCapeGlide: true,
      canGrapple: false,
      hasHelmetToggle: false,
      hasIronSpiderArms: false,
      hasBatmobileLink: false,
      heavyFootsteps: false,
    },
    quotes: [
      'Up, up, and away — the whole skyline is clear!',
      'Solar reserves at full power.',
      'Always ready to watch over the city.',
    ],
  },
];

export type HeroDodgeKind = 'none' | 'spider_flip' | 'combat_roll' | 'jet_dash' | 'cape_evade';

export interface HeroPowerOption {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  impactRadius: number;
  impactForce: number;
  damage: number;
  cooldownSec: number;
  mode: 'blast' | 'web_swing' | 'web_zip' | 'web_cyclone' | 'dive_slingshot' | 'slam' | 'grapple' | 'shield_pulse';
}

export const HERO_POWER_OPTIONS: Record<HeroCharacterId, readonly HeroPowerOption[]> = {
  spider_man: [
    {
      id: 'spider_pendulum_swing',
      label: 'Web-Swing',
      shortLabel: 'Swing',
      description: 'Insomniac pendulum web-swing with bottom-arc boost & 360° release spin',
      impactRadius: 6.5,
      impactForce: 20,
      damage: 48,
      cooldownSec: 0.35,
      mode: 'web_swing',
    },
    {
      id: 'spider_web_zip',
      label: 'Web-Zip Launch',
      shortLabel: 'Web-Zip',
      description: 'Point-launch forward zip + mid-air corkscrew spin boost',
      impactRadius: 7.5,
      impactForce: 24,
      damage: 56,
      cooldownSec: 0.45,
      mode: 'web_zip',
    },
    {
      id: 'spider_web_cyclone',
      label: 'Web Cyclone',
      shortLabel: 'Cyclone',
      description: '360° spinning web shockwave that blasts nearby props & structures',
      impactRadius: 10.5,
      impactForce: 30,
      damage: 74,
      cooldownSec: 0.75,
      mode: 'web_cyclone',
    },
    {
      id: 'spider_dive_slingshot',
      label: 'Dive Slingshot',
      shortLabel: 'Dive',
      description: 'Nose-down sky-dive into ultra-fast pendulum slingshot swing',
      impactRadius: 8.5,
      impactForce: 28,
      damage: 64,
      cooldownSec: 0.45,
      mode: 'dive_slingshot',
    },
  ],
  iron_man_classic: [
    { id: 'im_repulsor', label: 'Twin Repulsor', shortLabel: 'Repulsor', description: 'Precision palm plasma blasts', impactRadius: 8.5, impactForce: 26, damage: 65, cooldownSec: 0.6, mode: 'blast' },
    { id: 'im_unibeam', label: 'Chest Unibeam', shortLabel: 'Unibeam', description: 'High-energy chest arc beam burst', impactRadius: 11.0, impactForce: 34, damage: 88, cooldownSec: 1.0, mode: 'blast' },
    { id: 'im_shield_wave', label: 'Pulse Nova', shortLabel: 'Nova', description: '360° arc shockwave + shield surge', impactRadius: 12.0, impactForce: 36, damage: 78, cooldownSec: 1.1, mode: 'shield_pulse' },
  ],
  iron_man_advanced: [
    { id: 'ima_unibeam', label: 'Unibeam Barrage', shortLabel: 'Unibeam', description: 'Overcharged nano chest laser', impactRadius: 11.5, impactForce: 34, damage: 85, cooldownSec: 0.85, mode: 'blast' },
    { id: 'ima_nano_missiles', label: 'Nano Micro-Salvo', shortLabel: 'Salvo', description: 'Wide-area nanotech shockwave', impactRadius: 13.0, impactForce: 38, damage: 95, cooldownSec: 1.0, mode: 'blast' },
    { id: 'ima_emp', label: 'Nano Nova', shortLabel: 'Nova', description: 'Radial plasma field pulse', impactRadius: 14.0, impactForce: 40, damage: 88, cooldownSec: 1.15, mode: 'shield_pulse' },
  ],
  hulkbuster: [
    { id: 'hb_seismic', label: 'Seismic Slam', shortLabel: 'Slam', description: 'Ground-shattering hydraulic shockwave', impactRadius: 14.5, impactForce: 45, damage: 115, cooldownSec: 1.25, mode: 'slam' },
    { id: 'hb_jackhammer', label: 'Jackhammer Punch', shortLabel: 'Punch', description: 'Heavy forward piston strike', impactRadius: 10.0, impactForce: 48, damage: 105, cooldownSec: 0.85, mode: 'blast' },
    { id: 'hb_fortress_pulse', label: 'Reactor Quake', shortLabel: 'Quake', description: 'Full-armour radial blast', impactRadius: 16.0, impactForce: 50, damage: 125, cooldownSec: 1.5, mode: 'shield_pulse' },
  ],
  batman: [
    { id: 'bat_grapple', label: 'Grapple Zip', shortLabel: 'Grapple', description: 'High-speed rooftop grapple launcher', impactRadius: 6.5, impactForce: 18, damage: 45, cooldownSec: 0.9, mode: 'grapple' },
    { id: 'bat_batarang', label: 'Sonic Batarang', shortLabel: 'Batarang', description: 'Explosive concussion batarang wave', impactRadius: 9.0, impactForce: 26, damage: 64, cooldownSec: 0.65, mode: 'blast' },
    { id: 'bat_smoke_slam', label: 'Tactical Slam', shortLabel: 'Slam', description: 'Cape-drop shockwave strike', impactRadius: 8.0, impactForce: 24, damage: 58, cooldownSec: 0.8, mode: 'slam' },
  ],
  superman: [
    { id: 'sup_solar_blast', label: 'Heat Vision', shortLabel: 'Heat Beam', description: 'Focused solar laser blast', impactRadius: 12.0, impactForce: 38, damage: 95, cooldownSec: 0.8, mode: 'blast' },
    { id: 'sup_sonic_slam', label: 'Krypton Slam', shortLabel: 'Slam', description: 'Supersonic ground crater shockwave', impactRadius: 15.0, impactForce: 46, damage: 118, cooldownSec: 1.15, mode: 'slam' },
    { id: 'sup_solar_flare', label: 'Solar Flare', shortLabel: 'Flare', description: 'Radiant 360° golden burst', impactRadius: 14.5, impactForce: 42, damage: 106, cooldownSec: 1.2, mode: 'shield_pulse' },
  ],
  steve_harrington: [
    { id: 'steve_bat_smash', label: 'Nail-Bat Smash', shortLabel: 'Bat Smash', description: 'Signature 1980s spiked bat strike', impactRadius: 5.5, impactForce: 16, damage: 45, cooldownSec: 0.65, mode: 'blast' },
    { id: 'steve_spin_bat', label: '360° Bat Swing', shortLabel: 'Spin Swing', description: 'Whirling crowd-clearing bat arc', impactRadius: 7.2, impactForce: 22, damage: 62, cooldownSec: 0.9, mode: 'slam' },
  ],
};

export function getHeroPowerOptions(heroId: HeroCharacterId): readonly HeroPowerOption[] {
  return HERO_POWER_OPTIONS[heroId] ?? HERO_POWER_OPTIONS.steve_harrington;
}

export interface ActiveHeroRuntimeState {
  activeHeroId: HeroCharacterId | null;
  activeOutfitId: HeroOutfitId | null;
  activePowerIndex: number;
  helmetOpen: boolean;
  isFlying: boolean;
  isGliding: boolean;
  isWebSwinging: boolean;
  isDiving: boolean;
  energyShieldActive: boolean;
  detectiveVisionActive: boolean;
  spiderSenseActive: boolean;
  powerCooldown: number;
  secondaryTimer: number;
  attackAnimTimer: number;
  dodgeTimer: number;
  dodgeKind: HeroDodgeKind;
  airTrickKind: 'none' | 'front_flip' | 'corkscrew_spin' | 'back_tuck' | 'web_cyclone';
  airTrickTimer: number;
  airTrickAngle: number;
  swingComboCount: number;
  flyVelY: number;
  flightSpeedKmh: number;
}

export function createInitialHeroRuntimeState(): ActiveHeroRuntimeState {
  return {
    activeHeroId: null,
    activeOutfitId: null,
    activePowerIndex: 0,
    helmetOpen: false,
    isFlying: false,
    isGliding: false,
    isWebSwinging: false,
    isDiving: false,
    energyShieldActive: false,
    detectiveVisionActive: false,
    spiderSenseActive: false,
    powerCooldown: 0,
    secondaryTimer: 0,
    attackAnimTimer: 0,
    dodgeTimer: 0,
    dodgeKind: 'none',
    airTrickKind: 'none',
    airTrickTimer: 0,
    airTrickAngle: 0,
    swingComboCount: 0,
    flyVelY: 0,
    flightSpeedKmh: 0,
  };
}

export function getHeroById(id: HeroCharacterId): HeroCharacterSpec {
  return HERO_CHARACTERS.find((h) => h.id === id) ?? HERO_CHARACTERS[0];
}

export function getHeroOutfitById(
  heroId: HeroCharacterId,
  outfitId?: HeroOutfitId | null
): HeroOutfitSpec {
  const hero = getHeroById(heroId);
  if (outfitId) {
    const found = hero.outfits.find((o) => o.id === outfitId);
    if (found) return found;
  }
  return hero.outfits[0];
}

export function cycleHeroOutfit(
  heroId: HeroCharacterId,
  currentOutfitId: HeroOutfitId | null
): HeroOutfitSpec {
  const hero = getHeroById(heroId);
  if (hero.outfits.length <= 1) return hero.outfits[0];
  const idx = hero.outfits.findIndex((o) => o.id === currentOutfitId);
  return hero.outfits[(idx + 1) % hero.outfits.length];
}

export function computeHeroMovementMultipliers(heroId: HeroCharacterId | null): {
  walkSpeedMul: number;
  sprintSpeedMul: number;
  jumpMul: number;
  scaleMultiplier: number;
} {
  if (!heroId) {
    return { walkSpeedMul: 1, sprintSpeedMul: 1, jumpMul: 1, scaleMultiplier: 1 };
  }
  const h = getHeroById(heroId);
  return {
    walkSpeedMul: h.mobility.walkSpeedMul,
    sprintSpeedMul: h.mobility.sprintSpeedMul,
    jumpMul: h.mobility.jumpMul,
    scaleMultiplier: h.mobility.scaleMultiplier,
  };
}

export type SuitSkinCategory = 'all' | 'current_hero' | 'armour' | 'street_stealth';

export interface WearableSuitEntry {
  heroId: HeroCharacterId;
  heroName: string;
  heroAlias: string;
  heightMeters: number;
  primaryPowerLabel: string;
  outfit: HeroOutfitSpec;
  category: 'armour' | 'street_stealth';
  traits: readonly string[];
}

const ARMOUR_OUTFIT_IDS = new Set<HeroOutfitId>([
  'iron_man_mk85',
  'iron_man_mk42_gold',
  'iron_man_mk50_nano',
  'iron_man_stealth_cobalt',
  'hulkbuster_mk44',
  'hulkbuster_mk48_titan',
  'batman_armoured_mech',
  'spider_iron',
]);

export function getAllWearableSuits(): WearableSuitEntry[] {
  const list: WearableSuitEntry[] = [];
  for (const hero of HERO_CHARACTERS) {
    for (const outfit of hero.outfits) {
      const isArmour = ARMOUR_OUTFIT_IDS.has(outfit.id);
      const traits: string[] = [];
      if (hero.mobility.canFly) traits.push('3D Flight');
      if (hero.mobility.canWebSwing) traits.push('Web-Swing');
      if (hero.mobility.canCapeGlide && !hero.mobility.canFly) traits.push('Cape Glide');
      if (hero.mobility.hasHelmetToggle) traits.push('Helmet Toggle');
      if (outfit.id === 'spider_iron') traits.push('4 Mechanical Arms');
      if (hero.mobility.heavyFootsteps) traits.push('Heavy Exoskeleton');
      if (hero.mobility.hasBatmobileLink) traits.push('Batmobile Link');
      if (traits.length === 0) traits.push('Agile Melee');

      list.push({
        heroId: hero.id,
        heroName: hero.name,
        heroAlias: hero.alias,
        heightMeters: hero.mobility.heightMeters,
        primaryPowerLabel: hero.primaryPower.label,
        outfit,
        category: isArmour ? 'armour' : 'street_stealth',
        traits,
      });
    }
  }
  return list;
}

export function filterWearableSuits(
  category: SuitSkinCategory,
  currentHeroId?: HeroCharacterId | null
): WearableSuitEntry[] {
  const all = getAllWearableSuits();
  if (category === 'all') return all;
  if (category === 'current_hero') {
    if (!currentHeroId) return all;
    return all.filter((entry) => entry.heroId === currentHeroId);
  }
  return all.filter((entry) => entry.category === category);
}


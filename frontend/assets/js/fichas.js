/* Fichas técnicas de referencia (Bajaj).
   Solo datos publicados por el fabricante (bajajauto.com) o por el distribuidor (somosmoto.pe).
   Si un dato no figura en la fuente, el campo se omite: la ficha no inventa valores.
   Clave = nombre exacto del modelo en el catálogo. */
const BAJAJ = (ruta) => ({ n: 'Bajaj Perú', u: 'https://www.bajajauto.com/' + ruta });
const SOMOS = (ruta) => ({ n: 'Somosmoto', u: 'https://somosmoto.pe/' + ruta });

const FICHAS = {
  'CT 125': {
    motor: '4 tiempos · refrigerado por aire', cc: '124.5 cc', potencia: '9.9 HP', torque: '10.5 Nm', transmision: '5 velocidades',
    tanque: '10.5 L', peso: '115 kg (en vacío)', freno_del: 'Tambor 130 mm', freno_tras: 'Tambor 130 mm',
    susp_del: 'Horquilla telescópica hidráulica', susp_tras: 'Doble amortiguador', neum_del: '2.75-17', neum_tras: '3.00-17',
    fuente: [BAJAJ('es-pe/motocicletas/ct-125-alloy')],
  },
  'Boxer Cargo 150X UG Disc': {
    motor: '4 tiempos · 1 cilindro · refrigerado por aire · OHC', cc: '144.8 cc', potencia: '11.8 HP', torque: '12.5 Nm', transmision: '5 velocidades',
    arranque: 'Eléctrico y de pedal', tanque: '11 L', peso: '125 kg (en vacío)', freno_del: 'Disco 240 mm', freno_tras: 'Tambor 130 mm',
    susp_del: 'Horquilla telescópica', susp_tras: 'Doble amortiguador', neum_del: '3.00-17', neum_tras: '100/90-17',
    fuente: [BAJAJ('es-pe/motocicletas/boxer-150x')],
  },
  'Discover 125 ST': {
    motor: '4 tiempos · refrigerado por aire · carburador · 2 válvulas', cc: '124.6 cc', potencia: '12.8 HP', torque: '10.8 Nm', transmision: '5 velocidades',
    arranque: 'Eléctrico y de pedal', tanque: '10 L', peso: '125 kg (en vacío)', freno_del: 'Disco', freno_tras: 'Tambor 130 mm',
    susp_del: 'Horquilla telescópica', susp_tras: 'Monoamortiguador', neum_del: '2.75-17', neum_tras: '3.00-17',
    fuente: [BAJAJ('es-pe/motocicletas/discover-125-st')],
  },
  'Pulsar LS/NS 125': {
    motor: '4 tiempos · SOHC · DTSi · refrigerado por aire · carburador', cc: '125 cc', potencia: '11.8–12 HP', torque: '10.8 Nm', transmision: '5 velocidades',
    arranque: 'Eléctrico y de pedal', peso: '125 kg', freno_del: 'Disco ventilado 240 mm · CBS', freno_tras: 'Tambor mecánico (130–150 mm según versión)',
    susp_del: 'Horquillas telescópicas', susp_tras: 'Doble amortiguador con gas Nitrox', neum_del: '70/80-17 con cámara', neum_tras: '100/90-17 con cámara',
    fuente: [SOMOS('bajaj-pulsar/pistera/ls125-2026/qeAb')],
    nota: 'Los valores combinan las versiones LS125 y NS125. Pregunta al asesor cuál tiene la unidad disponible.',
  },
  'Pulsar N125 Carburada': {
    motor: '4 tiempos · OHC · carburador', cc: '124.6 cc', potencia: '12 HP', torque: '11 Nm @ 6000 rpm', transmision: '5 velocidades',
    arranque: 'Eléctrico y de pedal', peso: '125 kg', freno_del: 'Disco ventilado 240 mm', freno_tras: 'Tambor mecánico',
    susp_del: 'Horquillas telescópicas', susp_tras: 'Monoshock', neum_del: '90/90-17 tubeless', neum_tras: '120/80-17 tubeless',
    fuente: [SOMOS('bajaj-pulsar/pistera/n125-carburada-2026/neGJ')],
  },
  'Pulsar N125FI': {
    motor: '4 tiempos · refrigerado por aire · inyección electrónica (FI) · 2 válvulas', cc: '124.6 cc', potencia: '12 PS @ 8500 rpm', torque: '11 Nm @ 6000 rpm', transmision: '5 velocidades',
    arranque: 'Eléctrico y de pedal', tanque: '9.1 L', peso: '125 kg (en orden de marcha)', freno_del: 'Disco 240 mm', freno_tras: 'Tambor 130 mm · CBS',
    susp_del: 'Telescópica (125 mm de recorrido)', susp_tras: 'Monoshock (125 mm de recorrido)', neum_del: '80/100-17 tubeless', neum_tras: '110/80-17 tubeless',
    fuente: [BAJAJ('es-pe/motocicletas/pulsar-n125')],
  },
  'Pulsar 150 Neon': {
    motor: '4 tiempos · Twin Spark DTSi · refrigerado por aire · carburador · 2 válvulas', cc: '149.5 cc', potencia: '13.8 HP', torque: '13.4 Nm', transmision: '5 velocidades',
    arranque: 'Eléctrico y de pedal', tanque: '15 L', peso: '146 kg (en orden de marcha)', freno_del: 'Disco 240 mm', freno_tras: 'Disco 230 mm',
    susp_del: 'Horquilla telescópica', susp_tras: 'Doble amortiguador', neum_del: '90/90-17', neum_tras: '120/80-17',
    fuente: [BAJAJ('en-pe/motorcycles/pulsar-150-neon')],
    nota: 'Algunos lotes se publican con tambor trasero. Confirma el equipamiento con el asesor.',
  },
  'Pulsar 150R': {
    motor: '1 cilindro · 4 tiempos · OHC · refrigerado por aire · carburador', cc: '149.5 cc', potencia: '13.8 HP', torque: '13.4 Nm @ 6000 rpm', transmision: '5 velocidades',
    arranque: 'Eléctrico', tanque: '≈ 15 L', peso: '144 kg', freno_del: 'Disco ventilado 260 mm · pinza de doble pistón', freno_tras: 'Disco ventilado 230 mm',
    susp_del: 'Horquilla telescópica', susp_tras: 'Doble amortiguador con gas Nitrox', neum_del: '90/90-17 tubeless', neum_tras: '120/80-17 tubeless',
    fuente: [SOMOS('bajaj-pulsar/pistera/150r-2026/MoWZ')],
  },
  'Pulsar N160 FI': {
    motor: '4 tiempos · 1 cilindro · refrigerado por aire · inyección electrónica (FI) · 2 válvulas', cc: '164.8 cc', potencia: '15.8 HP', torque: '14.7 Nm', transmision: '5 velocidades',
    arranque: 'Eléctrico', tanque: '14 L', peso: '154 kg (en orden de marcha)', freno_del: 'Disco 300 mm', freno_tras: 'Disco 230 mm',
    susp_del: 'Horquilla invertida (USD)', susp_tras: 'Monoshock', neum_del: '100/80-17', neum_tras: '130/70-17',
    fuente: [BAJAJ('en-pe/motorcycles/pulsar-n160-fi-abs')],
    nota: 'Los datos son de la versión N160 FI ABS del fabricante. Confirma con el asesor si la unidad lleva ABS.',
  },
  'Pulsar NS160 ABS UG2': {
    motor: '4 tiempos · 1 cilindro · refrigerado por aceite · inyección electrónica · DTSi', cc: '160.3 cc', potencia: '17 PS @ 9000 rpm', torque: '14.6 Nm @ 7250 rpm', transmision: '5 velocidades',
    arranque: 'Eléctrico y de pedal', tanque: '12 L', peso: '152 kg (en orden de marcha)', freno_del: 'Disco 300 mm hidráulico', freno_tras: 'Disco 230 mm hidráulico', abs: 'Sí, doble canal',
    susp_del: 'Horquilla invertida (USD) de 33 mm', susp_tras: 'Monoshock Nitrox con canister', neum_del: '100/80-17 tubeless', neum_tras: '130/70-17 tubeless',
    fuente: [BAJAJ('en-pe/bikes/pulsar-ns160-fi-abs')],
  },
  'Pulsar 180 Neon': {
    motor: '4 tiempos · DTSi Twin Spark · refrigerado por aire · carburador · 2 válvulas', cc: '178.6 cc', potencia: '17 HP', torque: '14.5 Nm',
    tanque: '15 L', peso: '145 kg (en orden de marcha)', freno_del: 'Disco 280 mm', freno_tras: 'Disco 230 mm',
    susp_del: 'Horquilla telescópica de 31 mm', susp_tras: 'Doble amortiguador regulable', neum_del: '90/90-17', neum_tras: '120/80-17',
    fuente: [BAJAJ('en-pe/motorcycles/pulsar-180-neon')],
  },
  'Pulsar NS200 ABS UG2': {
    motor: 'Triple Spark DTS-i 4V · 4 tiempos · refrigerado por líquido · inyección electrónica · 4 válvulas', cc: '199.5 cc', potencia: '24.2 HP', torque: '18.7 Nm', transmision: '6 velocidades',
    tanque: '12 L', peso: '158 kg (en orden de marcha)', freno_del: 'Disco 300 mm', freno_tras: 'Disco 230 mm', abs: 'Sí',
    susp_del: 'Horquilla invertida (USD)', susp_tras: 'Monoshock', neum_del: '100/80-17', neum_tras: '130/70-17',
    fuente: [BAJAJ('en-pe/motorcycles/pulsar-ns-200-abs-fi')],
  },
  'Pulsar RS200': {
    motor: 'DTS-i Triple Spark · 4 válvulas · refrigerado por líquido', cc: '199.5 cc', potencia: '24.5 PS @ 9750 rpm', torque: '18.3 Nm @ 8000 rpm', transmision: '6 velocidades',
    arranque: 'Eléctrico', tanque: '13 L', peso: '165 kg (en vacío)', freno_del: 'Disco 300 mm', freno_tras: 'Disco 230 mm', abs: 'Sí',
    susp_del: 'Horquilla telescópica', susp_tras: 'Monoshock Nitrox', neum_del: '100/80-17 sin cámara', neum_tras: '130/70-17 sin cámara',
    fuente: [SOMOS('bajaj-pulsar/deportiva/rs200-2026/1Jaw')],
  },
  'Pulsar N250 UG': {
    motor: '4 tiempos · 2 válvulas · refrigerado por aceite · DTS-i', cc: '249 cc', potencia: '24.5 PS @ 8750 rpm', torque: '21.5 Nm @ 6500 rpm', transmision: '5 velocidades',
    arranque: 'Eléctrico', tanque: '14 L', peso: '162 kg (en vacío)', freno_del: 'Disco 300 mm', freno_tras: 'Disco 230 mm', abs: 'Sí',
    susp_del: 'Horquilla telescópica de 37 mm', susp_tras: 'Monoshock', neum_del: '100/80-17 sin cámara', neum_tras: '130/70-17 sin cámara',
    fuente: [SOMOS('bajaj-pulsar/naked/n250-ug-2025/zaLk')],
  },
  'Pulsar NS400Z': {
    motor: 'Refrigerado por líquido · 4 válvulas · inyección electrónica (FI)', cc: '373.3 cc', potencia: '40 CV @ 8500 rpm', torque: '35 Nm @ 7000 rpm', transmision: '6 velocidades',
    arranque: 'Eléctrico', tanque: '12 L', peso: '176 kg (en vacío)', freno_del: 'Disco 320 mm', freno_tras: 'Disco 230 mm', abs: 'Sí',
    susp_del: 'Horquilla invertida (USD) de 43 mm', susp_tras: 'Monoshock', neum_del: '110/70-17', neum_tras: '140/70-17',
    fuente: [BAJAJ('es-pe/motocicletas/pulsar-ns400z')],
  },
  'Dominar 250': {
    motor: 'Refrigerado por líquido · inyección electrónica · DOHC · 4 válvulas', cc: '249 cc', potencia: '27 PS @ 8500 rpm', torque: '23.5 Nm @ 6500 rpm', transmision: '6 velocidades',
    tanque: '13 L', peso: '182 kg (en vacío)', freno_del: 'Disco 300 mm · pinza de montaje radial', freno_tras: 'Disco 230 mm', abs: 'Sí',
    susp_del: 'Horquilla invertida (USD) de 37 mm', susp_tras: 'Monoshock', neum_del: '100/80-17', neum_tras: '130/70-17',
    fuente: [BAJAJ('es-pe/motocicletas/dominar-250')],
  },
  'Dominar 400 2.0': {
    motor: 'Monocilíndrico · 4 tiempos · refrigerado por líquido · 4 válvulas · DTS-i', cc: '373.3 cc', potencia: '39.5 HP', torque: '35 Nm @ 7000 rpm', transmision: '6 velocidades',
    arranque: 'Eléctrico', tanque: '13 L', peso: '192 kg (en vacío)', freno_del: 'Disco 320 mm', freno_tras: 'Disco 230 mm', abs: 'Sí',
    susp_del: 'Horquilla invertida (USD) de 43 mm', susp_tras: 'Monoshock', neum_del: '110/70-17', neum_tras: '150/60-17',
    fuente: [BAJAJ('es-pe/motocicletas/dominar-d400')],
  },
};
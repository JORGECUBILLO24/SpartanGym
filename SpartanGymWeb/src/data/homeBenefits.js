import { CalendarCheck, Dumbbell, UsersRound } from 'lucide-react';
import ImagenEntrenador from '../assets/gym-youngla-coach.webp';
import ImagenInstalaciones from '../assets/gym-aesthetic-workout.webp';
import ImagenComunidad from '../assets/gym-youngla-athlete.webp';

export const beneficiosInicio = [
  {
    ruta: 'entrenamiento',
    titulo: 'Entrenamiento acompañado',
    etiqueta: 'Apoyo constante',
    resumen:
      'Nuestro objetivo es acompañarte en cada rutina. Siempre habrá un entrenador ayudándote a mejorar tu técnica, entrenar con confianza y avanzar sin sentirte solo.',
    imagen: ImagenEntrenador,
    imagenAlt: 'Entrenador atlético de alto rendimiento guiando técnica de levantamiento',
    icono: Dumbbell,
    estadistica: 'Entrenadores expertos',
    puntos: [
      'Asesoría personalizada en cada ejercicio.',
      'Prevención de lesiones con guía en tiempo real.',
      'Planes de entrenamiento que evolucionan contigo.',
    ],
  },
  {
    ruta: 'instalaciones',
    titulo: 'Instalaciones de calidad',
    etiqueta: 'Espacio premium',
    resumen:
      'Contamos con instalaciones de calidad, máquinas modernas y espacios cuidados para que cada entrenamiento se sienta cómodo, seguro y potente.',
    imagen: ImagenInstalaciones,
    imagenAlt: 'Instalaciones de alta gama con equipamiento de pesas y máquinas modernas',
    icono: CalendarCheck,
    estadistica: 'Equipo moderno',
    puntos: [
      'Máquinas de última generación para todos los músculos.',
      'Espacios amplios y ventilados para tu comodidad.',
      'Mantenimiento continuo y limpieza impecable.',
    ],
  },
  {
    ruta: 'comunidad',
    titulo: 'Ambiente motivador',
    etiqueta: 'Disciplina juntos',
    resumen:
      'Entrena rodeado de energía, disciplina y personas que te impulsan a regresar, dar un poco más y celebrar cada avance.',
    imagen: ImagenComunidad,
    imagenAlt: 'Atletas entrenando en un ambiente de alta disciplina y enfoque Spartan',
    icono: UsersRound,
    estadistica: 'Comunidad Spartan',
    puntos: [
      'Ambiente de respeto, disciplina y progreso.',
      'Comunidad activa dispuesta a apoyarse.',
      'Motivación diaria para volver y superarte.',
    ],
  },
];

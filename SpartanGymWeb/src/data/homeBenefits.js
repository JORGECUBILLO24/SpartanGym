import { CalendarCheck, Dumbbell, UsersRound } from 'lucide-react';
import ImagenEntrenador from '../assets/beneficio-entrenador.webp';
import ImagenInstalaciones from '../assets/fondo_login.webp';
import ImagenComunidad from '../assets/MembresiaSpartan.webp';

export const beneficiosInicio = [
  {
    ruta: 'entrenamiento',
    titulo: 'Entrenamiento acompañado',
    etiqueta: 'Apoyo constante',
    resumen:
      'Nuestro objetivo es acompañarte en cada rutina. Siempre habrá un entrenador ayudándote a mejorar tu técnica, entrenar con confianza y avanzar sin sentirte solo.',
    imagen: ImagenEntrenador,
    imagenAlt: 'Entrenador guiando a un socio durante una rutina en máquina',
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
    imagenAlt: 'Instalaciones y equipo de Spartan Gym',
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
    imagenAlt: 'Membresía Spartan Gym como símbolo de comunidad',
    icono: UsersRound,
    estadistica: 'Comunidad Spartan',
    puntos: [
      'Ambiente de respeto, disciplina y progreso.',
      'Comunidad activa dispuesta a apoyarse.',
      'Motivación diaria para volver y superarte.',
    ],
  },
];

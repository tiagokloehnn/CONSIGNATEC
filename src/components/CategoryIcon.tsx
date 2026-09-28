import React from 'react';
import {
  Home,
  UtensilsCrossed,
  Car,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Tv,
  ShoppingBag,
  TrendingUp,
  PawPrint,
  Plane,
  Dumbbell,
  Baby,
  Gift,
  Briefcase,
  Coffee,
  Wrench,
  ShieldCheck,
  Smartphone,
  Tag,
  Target,
} from 'lucide-react';

interface CategoryIconProps {
  iconName: string;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  iconName,
  className = 'h-4 w-4',
}) => {
  switch (iconName) {
    case 'Home':
      return <Home className={className} />;
    case 'UtensilsCrossed':
      return <UtensilsCrossed className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'HeartPulse':
      return <HeartPulse className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Tv':
      return <Tv className={className} />;
    case 'ShoppingBag':
      return <ShoppingBag className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    case 'PawPrint':
      return <PawPrint className={className} />;
    case 'Plane':
      return <Plane className={className} />;
    case 'Dumbbell':
      return <Dumbbell className={className} />;
    case 'Baby':
      return <Baby className={className} />;
    case 'Gift':
      return <Gift className={className} />;
    case 'Briefcase':
      return <Briefcase className={className} />;
    case 'Coffee':
      return <Coffee className={className} />;
    case 'Wrench':
      return <Wrench className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Smartphone':
      return <Smartphone className={className} />;
    case 'Tag':
    default:
      return <Tag className={className} />;
  }
};

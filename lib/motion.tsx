// A lightweight motion library to avoid installing framer-motion
// This provides basic animation capabilities

type MotionProps = {
  initial?: Record<string, number>;
  animate?: Record<string, number>;
  transition?: {
    duration?: number;
    delay?: number;
    ease?: string;
  };
  className?: string;
  style?: React.CSSProperties;
};

type MotionComponent = React.FC<MotionProps & { children: React.ReactNode }>;

export const motion = {
  div: ({ children, initial, animate, transition, ...props }: MotionProps & { children: React.ReactNode }) => {
    const initialStyles = initial || {};
    const animateStyles = animate || {};
    
    const getAnimationStyle = () => {
      return {
        ...props.style,
        opacity: animateStyles.opacity !== undefined ? animateStyles.opacity : initialStyles.opacity,
        transform: `translateY(${animateStyles.y !== undefined ? animateStyles.y : (initialStyles.y || 0)}px)`,
        transition: `all ${transition?.duration || 0.3}s ${transition?.ease || 'ease-in-out'} ${transition?.delay || 0}s`,
      };
    };

    return (
      <div 
        {...props} 
        style={getAnimationStyle()}
        className={props.className}
      >
        {children}
      </div>
    );
  }
} as { div: MotionComponent };
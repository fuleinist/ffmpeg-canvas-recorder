type TweenBase = { 
  type: 'video' | 'image' | 'transition',
  url: string,
  startAt: number,
  endAt: number,
  keyframes?: Keyframe[]
}

type TweenVideo = TweenBase & { 
  type: 'video',
}

type TweenImage = TweenBase & { 
  type: 'image',
}

type TweenTransition = Omit<TweenBase, 'url'> & { 
  type: 'transition',
  transition: 'fade' | 'slide' | 'drop' | 'zoom',
}

type Keyframe = { 
  opacity?: number;
  scaleX?: number; 
  scaleY?: number; 
  x?: number;
  y?: number;
  ease?: string;
  offset?: number;
}

export const timeline1config: (TweenVideo | TweenImage | TweenTransition)[] = [
  {
    type: 'video',
    url: '',
    startAt: 0,
    endAt: 4000
  },
  {
    type: 'transition',
    transition: 'fade',
    startAt: 3500,
    endAt: 4500
  },
  {
    type: 'video',
    url: '',
    startAt: 4000,
    endAt: 8000
  },
  {
    type: 'image',
    url: '',
    startAt: 8000,
    endAt: 12000,
    keyframes: [
      {
        opacity: 0,
        offset: 0
      },
      {
        opacity: 1,
        offset: 1000
      }
    ]
  }
]
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Word lists for generating random slugs
const adjectives = [
  'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'black', 'white', 'gray',
  'bright', 'dark', 'light', 'deep', 'pale', 'bold', 'soft', 'warm', 'cool', 'fresh',
  'quick', 'slow', 'fast', 'lazy', 'busy', 'calm', 'wild', 'gentle', 'fierce', 'brave',
  'smart', 'clever', 'wise', 'funny', 'happy', 'sad', 'angry', 'excited', 'peaceful', 'loud',
  'quiet', 'big', 'small', 'tiny', 'huge', 'giant', 'mini', 'long', 'short', 'tall'
]

const nouns = [
  'cat', 'dog', 'bird', 'fish', 'rabbit', 'mouse', 'lion', 'tiger', 'bear', 'wolf',
  'monkey', 'elephant', 'giraffe', 'zebra', 'horse', 'cow', 'pig', 'sheep', 'goat', 'chicken',
  'tree', 'flower', 'leaf', 'branch', 'root', 'seed', 'fruit', 'berry', 'apple', 'orange',
  'star', 'moon', 'sun', 'cloud', 'rain', 'snow', 'wind', 'fire', 'water', 'earth',
  'rock', 'stone', 'mountain', 'hill', 'valley', 'river', 'lake', 'ocean', 'beach', 'forest'
]

export function generateRandomSlug(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adjective}-${noun}`
}
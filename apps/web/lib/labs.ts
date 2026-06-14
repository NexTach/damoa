export type Lab = {
  slug: string;
  index: string;
  title: string;
  tag: string;
  /** 포스터 액센트 색 */
  color: string;
  /** 구현 완료 여부 (false 면 placeholder) */
  ready: boolean;
};

export const LABS: Lab[] = [
  {
    slug: "shader",
    index: "01",
    title: "Shader Field",
    tag: "Fluid Light",
    color: "#d8ff2e",
    ready: true,
  },
  {
    slug: "transitions",
    index: "02",
    title: "View Transitions",
    tag: "Soft Morph",
    color: "#ff5e3a",
    ready: true,
  },
  {
    slug: "particles",
    index: "03",
    title: "Particle Drift",
    tag: "Stardust",
    color: "#48b0ff",
    ready: true,
  },
  {
    slug: "scroll",
    index: "04",
    title: "Scroll Stage",
    tag: "Descent",
    color: "#b06bff",
    ready: true,
  },
  {
    slug: "personae",
    index: "05",
    title: "Personae",
    tag: "Persona",
    color: "#27e8a7",
    ready: true,
  },
  {
    slug: "swarm",
    index: "06",
    title: "Murmuration",
    tag: "Swarm",
    color: "#ff4d8d",
    ready: true,
  },
  {
    slug: "orbit",
    index: "07",
    title: "Orbit",
    tag: "Gravity",
    color: "#ffd23e",
    ready: true,
  },
  {
    slug: "type",
    index: "08",
    title: "Kinetype",
    tag: "Typeflow",
    color: "#36e0ff",
    ready: true,
  },
];

export function getLab(slug: string): Lab | undefined {
  return LABS.find((l) => l.slug === slug);
}

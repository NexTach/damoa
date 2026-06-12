export type Lab = {
  slug: string;
  index: string;
  title: string;
  tag: string;
  blurb: string;
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
    tag: "GLSL · WebGL",
    blurb:
      "브라우저에서 실시간으로 도는 프래그먼트 셰이더. 마우스에 반응하는 유체 노이즈.",
    color: "#d8ff2e",
    ready: true,
  },
  {
    slug: "transitions",
    index: "02",
    title: "View Transitions",
    tag: "App Router",
    blurb: "View Transitions API 로 라우트 간 요소가 모핑되는 전환.",
    color: "#ff5e3a",
    ready: true,
  },
  {
    slug: "particles",
    index: "03",
    title: "Particle Drift",
    tag: "GPU Instancing",
    blurb: "수만 개 파티클을 인스턴싱으로 그리고 포인터로 흩뜨린다.",
    color: "#48b0ff",
    ready: true,
  },
  {
    slug: "scroll",
    index: "04",
    title: "Scroll Stage",
    tag: "Scroll-linked 3D",
    blurb: "스크롤에 묶인 3D 카메라 연출. 스크롤이 곧 타임라인.",
    color: "#b06bff",
    ready: true,
  },
];

export function getLab(slug: string): Lab | undefined {
  return LABS.find((l) => l.slug === slug);
}

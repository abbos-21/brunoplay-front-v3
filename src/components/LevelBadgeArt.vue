<script setup lang="ts">
import { computed, useId } from 'vue'
import { levelStyle } from '@/composables/levelStyles'

// The level badge artwork, recoloured per level (1-10). Every copy gets its own gradient and filter ids,
// so many badges can sit on one page.
const props = defineProps<{ level: number }>()
const uid = useId()
const p = computed(() => levelStyle(props.level))
</script>

<template>
<svg viewBox="0 0 175 98" fill="none" xmlns="http://www.w3.org/2000/svg" class="badge-art" :class="{ prismatic: p.prismatic }" :style="{ filter: p.glow ? `drop-shadow(0 0 5px ${p.glow})` : undefined }" aria-hidden="true">
<g :filter="`url(#${uid}-filter0_d)`">
<g :filter="`url(#${uid}-filter1_ii)`">
<path d="M44.5244 21.5906C44.5244 19.6192 45.6829 17.8318 47.4824 17.0266L83.4964 0.913605C84.7957 0.3323 86.2811 0.3323 87.5804 0.913605L123.594 17.0266C125.394 17.8318 126.552 19.6192 126.552 21.5906V68.3247C126.552 70.2961 125.394 72.0835 123.594 72.8887L87.5804 89.0017C86.2811 89.583 84.7957 89.583 83.4964 89.0017L47.4824 72.8887C45.6829 72.0835 44.5244 70.2961 44.5244 68.3247V21.5906Z" :fill="`url(#${uid}-paint0_linear)`"/>
</g>
<g :filter="`url(#${uid}-filter2_ii)`">
<path d="M57.6054 54.5346C51.2695 58.8082 39.7936 52.8737 31.9732 41.2794C24.1528 29.6852 -1.33397 26.2024 5.00187 21.9288C11.3377 17.6553 47.0969 14.2092 54.9173 25.8034C62.7377 37.3977 63.9412 50.2611 57.6054 54.5346Z" :fill="p.wing"/>
</g>
<path d="M54.7103 25.9436C58.6015 31.7127 60.839 37.7875 61.3209 42.9375C61.8037 48.0982 60.5224 52.2659 57.4657 54.3277C54.409 56.3894 50.0647 56.0162 45.4607 53.6353C40.8662 51.2593 36.0719 46.9091 32.1806 41.1401C30.1957 38.1974 27.1002 35.7825 23.6967 33.7508C20.2913 31.718 16.5567 30.0566 13.2785 28.6298C9.98578 27.1965 7.17983 26.0104 5.58438 24.919C5.18854 24.6482 4.87736 24.3888 4.65439 24.141C4.43085 23.8924 4.30746 23.6669 4.26638 23.4627C4.1912 23.0884 4.37621 22.6524 5.14192 22.1359C5.90238 21.6231 7.12546 21.1108 8.71718 20.6326C10.3042 20.1557 12.2406 19.7173 14.416 19.3472C18.7671 18.6067 24.0611 18.1392 29.4014 18.1659C34.7431 18.1926 40.1209 18.714 44.6438 19.9469C49.1747 21.182 52.8054 23.1195 54.7103 25.9436Z" :stroke="p.stroke" stroke-width="0.5"/>
<g :filter="`url(#${uid}-filter3_ii)`">
<path d="M52.7789 46.3564C48.555 49.2055 40.9044 45.2491 35.6908 37.5196C30.4772 29.7901 13.486 27.4683 17.7099 24.6192C21.9338 21.7702 45.7733 19.4728 50.9869 27.2023C56.2005 34.9318 57.0028 43.5074 52.7789 46.3564Z" :fill="p.wingDark"/>
</g>
<path d="M50.8624 27.2866C53.4578 31.1346 54.951 35.1874 55.2725 38.624C55.5945 42.0668 54.7399 44.853 52.6948 46.2324C50.6496 47.6117 47.7462 47.3606 44.6748 45.7723C41.6088 44.1868 38.4105 41.2841 35.815 37.4362C34.4938 35.4774 32.4327 33.8692 30.1647 32.5153C27.8954 31.1607 25.4065 30.0529 23.221 29.1016C21.0269 28.1466 19.1546 27.3549 18.0893 26.6262C17.8247 26.4451 17.6153 26.2713 17.4654 26.1046C17.3155 25.9379 17.2311 25.7855 17.2029 25.6456C17.1507 25.3859 17.2818 25.0894 17.7939 24.744C18.303 24.4006 19.1202 24.0577 20.182 23.7386C21.2408 23.4205 22.5326 23.1283 23.9834 22.8814C26.8851 22.3877 30.4152 22.0766 33.9763 22.0944C37.5382 22.1122 41.1248 22.4595 44.1419 23.2818C47.1639 24.1056 49.5891 25.3989 50.8624 27.2866Z" :stroke="p.stroke" stroke-width="0.3"/>
<g :filter="`url(#${uid}-filter4_ii)`">
<path d="M113.416 54.5346C119.752 58.8082 131.228 52.8737 139.048 41.2794C146.869 29.6852 172.355 26.2024 166.02 21.9288C159.684 17.6553 123.925 14.2092 116.104 25.8034C108.284 37.3977 107.08 50.2611 113.416 54.5346Z" :fill="p.wing"/>
</g>
<path d="M116.311 25.9436C112.42 31.7127 110.182 37.7875 109.701 42.9375C109.218 48.0982 110.499 52.2659 113.556 54.3277C116.613 56.3894 120.957 56.0162 125.561 53.6353C130.155 51.2593 134.95 46.9091 138.841 41.1401C140.826 38.1974 143.921 35.7825 147.325 33.7508C150.73 31.718 154.465 30.0566 157.743 28.6298C161.036 27.1965 163.842 26.0104 165.437 24.919C165.833 24.6482 166.144 24.3888 166.367 24.141C166.591 23.8924 166.714 23.6669 166.755 23.4627C166.83 23.0884 166.645 22.6524 165.88 22.1359C165.119 21.6231 163.896 21.1108 162.304 20.6326C160.717 20.1557 158.781 19.7173 156.605 19.3472C152.254 18.6067 146.96 18.1392 141.62 18.1659C136.278 18.1926 130.901 18.714 126.378 19.9469C121.847 21.182 118.216 23.1195 116.311 25.9436Z" :stroke="p.stroke" stroke-width="0.5"/>
<g :filter="`url(#${uid}-filter5_ii)`">
<path d="M118.047 46.3564C122.271 49.2055 129.922 45.2491 135.135 37.5196C140.349 29.7901 157.34 27.4683 153.116 24.6192C148.892 21.7702 125.053 19.4728 119.839 27.2023C114.626 34.9318 113.823 43.5074 118.047 46.3564Z" :fill="p.wingDark"/>
</g>
<path d="M119.964 27.2866C117.368 31.1346 115.875 35.1874 115.554 38.624C115.232 42.0668 116.086 44.853 118.131 46.2324C120.177 47.6117 123.08 47.3606 126.151 45.7723C129.217 44.1868 132.416 41.2841 135.011 37.4362C136.332 35.4774 138.393 33.8692 140.662 32.5153C142.931 31.1607 145.42 30.0529 147.605 29.1016C149.799 28.1466 151.672 27.3549 152.737 26.6262C153.002 26.4451 153.211 26.2713 153.361 26.1046C153.511 25.9379 153.595 25.7855 153.623 25.6456C153.675 25.3859 153.544 25.0894 153.032 24.744C152.523 24.4006 151.706 24.0577 150.644 23.7386C149.585 23.4205 148.294 23.1283 146.843 22.8814C143.941 22.3877 140.411 22.0766 136.85 22.0944C133.288 22.1122 129.701 22.4595 126.684 23.2818C123.662 24.1056 121.237 25.3989 119.964 27.2866Z" :stroke="p.stroke" stroke-width="0.3"/>
<g :filter="`url(#${uid}-filter6_ii)`">
<path d="M58.1963 26.6633C58.1963 25.5346 58.8298 24.5015 59.8356 23.9896L83.2712 12.0632C84.6961 11.3381 86.3818 11.3381 87.8067 12.0632L111.242 23.9896C112.248 24.5015 112.882 25.5346 112.882 26.6633V63.3369C112.882 64.4656 112.248 65.4987 111.242 66.0106L87.8067 77.937C86.3818 78.6621 84.6961 78.6621 83.2712 77.937L59.8356 66.0106C58.8298 65.4987 58.1963 64.4656 58.1963 63.3369V26.6633Z" :fill="`url(#${uid}-paint1_linear)`"/>
</g>
<path d="M83.3848 12.2861C84.7384 11.5973 86.3398 11.5973 87.6934 12.2861L111.129 24.2119C112.051 24.6811 112.632 25.6286 112.632 26.6631V63.3369C112.632 64.3715 112.051 65.3188 111.129 65.7881L87.6934 77.7139C86.3397 78.4027 84.7384 78.4027 83.3848 77.7139L59.9492 65.7881C59.0272 65.3188 58.4463 64.3715 58.4463 63.3369V26.6631C58.4464 25.6286 59.0272 24.6811 59.9492 24.2119L83.3848 12.2861Z" :stroke="p.stroke" stroke-width="0.5"/>
</g>
<defs>
<filter :id="`${uid}-filter0_d`" x="0" y="0" width="178.511" height="98" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="4"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="out"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1822_343"/>
<feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1822_343" result="shape"/>
</filter>
<filter :id="`${uid}-filter1_ii`" x="44.5244" y="-1.52246" width="82.0283" height="92.96" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="-2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_1822_343"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="effect1_innerShadow_1822_343" result="effect2_innerShadow_1822_343"/>
</filter>
<filter :id="`${uid}-filter2_ii`" x="4" y="15.915" width="57.6699" height="42.0068" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_1822_343"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="-2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="effect1_innerShadow_1822_343" result="effect2_innerShadow_1822_343"/>
</filter>
<filter :id="`${uid}-filter3_ii`" x="17.042" y="19.9434" width="38.4463" height="29.3379" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_1822_343"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="-2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="effect1_innerShadow_1822_343" result="effect2_innerShadow_1822_343"/>
</filter>
<filter :id="`${uid}-filter4_ii`" x="109.352" y="15.915" width="57.6699" height="42.0068" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.873865 0 0 0 0 0.873865 0 0 0 0 0.873865 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_1822_343"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="-2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="effect1_innerShadow_1822_343" result="effect2_innerShadow_1822_343"/>
</filter>
<filter :id="`${uid}-filter5_ii`" x="115.338" y="19.9434" width="38.4463" height="29.3379" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_1822_343"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="-2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="effect1_innerShadow_1822_343" result="effect2_innerShadow_1822_343"/>
</filter>
<filter :id="`${uid}-filter6_ii`" x="58.1963" y="9.51953" width="54.6855" height="70.9609" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_1822_343"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="-2"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="effect1_innerShadow_1822_343" result="effect2_innerShadow_1822_343"/>
</filter>
<filter :id="`${uid}-filter7_ii`" x="66.2656" y="34.3408" width="38.7627" height="20.9287" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feFlood flood-opacity="0" result="BackgroundImageFix"/>
<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="-1"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="shape" result="effect1_innerShadow_1822_343"/>
<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
<feOffset dy="1"/>
<feGaussianBlur stdDeviation="2"/>
<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
<feColorMatrix type="matrix" values="0 0 0 0 0.953993 0 0 0 0 0.953993 0 0 0 0 0.953993 0 0 0 0.25 0"/>
<feBlend mode="normal" in2="effect1_innerShadow_1822_343" result="effect2_innerShadow_1822_343"/>
</filter>
<linearGradient :id="`${uid}-paint0_linear`" x1="85.5384" y1="0" x2="85.5384" y2="89.9153" gradientUnits="userSpaceOnUse">
<stop :stop-color="p.shield[0]"/>
<stop offset="1" :stop-color="p.shield[1]"/>
</linearGradient>
<linearGradient :id="`${uid}-paint1_linear`" x1="85.539" y1="10.9092" x2="85.539" y2="79.091" gradientUnits="userSpaceOnUse">
<stop :stop-color="p.inner[0]"/>
<stop offset="1" :stop-color="p.inner[1]"/>
</linearGradient>
</defs>
</svg>
</template>

<style scoped>
/* the top level shifts through every colour */
.prismatic {
  animation: prism 6s linear infinite;
}
@keyframes prism {
  to {
    filter: hue-rotate(360deg) drop-shadow(0 0 6px rgba(255, 255, 255, 0.8));
  }
}
@media (prefers-reduced-motion: reduce) {
  .prismatic {
    animation: none;
  }
}
</style>

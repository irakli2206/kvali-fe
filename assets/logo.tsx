import React from 'react';

const KvaliLogo = ({ className = "", size = 140 }: { className?: string; size?: number }) => {
  // Maintaining the original 140:50 aspect ratio
  const scale = size / 140;
  const height = 50 * scale;

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 140 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g clipPath="url(#clip0_kvali_new)">
        <rect x="8" y="1" width="48" height="48" rx="24" fill="white" />
        
        <g filter="url(#filter0_f_kvali_new)">
          <circle cx="32" cy="49" r="24" fill="#34A853" />
        </g>
        <g filter="url(#filter1_f_kvali_new)">
          <circle cx="8" cy="25" r="24" fill="#FBBC04" />
        </g>
        <g filter="url(#filter2_f_kvali_new)">
          <circle cx="8" cy="49" r="24" fill="#91FF56" fillOpacity="0.5" />
        </g>
        <g filter="url(#filter3_f_kvali_new)">
          <circle cx="8" cy="1" r="24" fill="#EA7435" />
        </g>
        <g filter="url(#filter4_f_kvali_new)">
          <circle cx="32" cy="1" r="24" fill="#EA356E" />
        </g>
        <g filter="url(#filter5_f_kvali_new)">
          <circle cx="56" cy="25" r="24" fill="#3186FF" />
        </g>
        <g filter="url(#filter6_f_kvali_new)">
          <circle cx="32" cy="25" r="24" fill="url(#paint0_radial_kvali_new)" fillOpacity="0.2" />
        </g>
      </g>

      {/* "K" Symbol */}
      <path d="M41.408 31.52L39.232 29.056L47.552 20H51.872L41.408 31.52ZM37.984 36V13.6H41.568V36H37.984ZM48.16 36L42.528 27.712L44.864 25.216L52.416 36H48.16Z" fill="white" />
      
      {/* "v-a-l-i" Text */}
      <path d="M63.1873 36L69.4273 20H73.1393L66.5473 36H63.1873ZM62.9313 36L56.3073 20H59.9873L66.2593 36H62.9313ZM88.2215 36L88.0615 32.992V27.776C88.0615 26.688 87.9442 25.7813 87.7095 25.056C87.4962 24.3093 87.1335 23.744 86.6215 23.36C86.1308 22.9547 85.4695 22.752 84.6375 22.752C83.8695 22.752 83.1975 22.912 82.6215 23.232C82.0455 23.552 81.5548 24.0533 81.1495 24.736L78.0135 23.584C78.3548 22.88 78.8028 22.2293 79.3575 21.632C79.9335 21.0133 80.6482 20.5227 81.5015 20.16C82.3762 19.7973 83.4215 19.616 84.6375 19.616C86.1948 19.616 87.4962 19.9253 88.5415 20.544C89.5868 21.1413 90.3548 22.0053 90.8455 23.136C91.3575 24.2667 91.6135 25.632 91.6135 27.232L91.5175 36H88.2215ZM83.6135 36.384C81.6935 36.384 80.2002 35.9573 79.1335 35.104C78.0882 34.2507 77.5655 33.0453 77.5655 31.488C77.5655 29.824 78.1202 28.5547 79.2295 27.68C80.3602 26.8053 81.9282 26.368 83.9335 26.368H88.2215V29.12H85.0855C83.6562 29.12 82.6535 29.3227 82.0775 29.728C81.5015 30.112 81.2135 30.6667 81.2135 31.392C81.2135 32.0107 81.4588 32.5013 81.9495 32.864C82.4615 33.2053 83.1655 33.376 84.0615 33.376C84.8722 33.376 85.5762 33.1947 86.1735 32.832C86.7708 32.4693 87.2295 31.9893 87.5495 31.392C87.8908 30.7947 88.0615 30.1227 88.0615 29.376H89.1175C89.1175 31.552 88.6802 33.2693 87.8055 34.528C86.9308 35.7653 85.5335 36.384 83.6135 36.384ZM98.7628 36V13.6H102.347V36H98.7628ZM110.069 36V20H113.621V36H110.069ZM111.861 16.96C111.285 16.96 110.784 16.7573 110.357 16.352C109.952 15.9253 109.749 15.424 109.749 14.848C109.749 14.272 109.952 13.7813 110.357 13.376C110.784 12.9707 111.285 12.768 111.861 12.768C112.437 12.768 112.928 12.9707 113.333 13.376C113.76 13.7813 113.973 14.272 113.973 14.848C113.973 15.424 113.76 15.9253 113.333 16.352C112.928 16.7573 112.437 16.96 111.861 16.96ZM123.093 36.448C122.475 36.448 121.941 36.2347 121.493 35.808C121.067 35.36 120.853 34.8267 120.853 34.208C120.853 33.5893 121.067 33.056 121.493 32.608C121.941 32.16 122.475 31.936 123.093 31.936C123.712 31.936 124.245 32.16 124.693 32.608C125.141 33.056 125.365 33.5893 125.365 34.208C125.365 34.8267 125.141 35.36 124.693 35.808C124.245 36.2347 123.712 36.448 123.093 36.448Z" fill="#3186FF" />

      <defs>
        <filter id="filter0_f_kvali_new" x="-13.45" y="3.55" width="90.9" height="90.9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="10.725" result="effect1_foregroundBlur_kvali_new" />
        </filter>
        <filter id="filter1_f_kvali_new" x="-37.45" y="-20.45" width="90.9" height="90.9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="10.725" result="effect1_foregroundBlur_kvali_new" />
        </filter>
        <filter id="filter2_f_kvali_new" x="-37.45" y="3.55" width="90.9" height="90.9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="10.725" result="effect1_foregroundBlur_kvali_new" />
        </filter>
        <filter id="filter3_f_kvali_new" x="-37.45" y="-44.45" width="90.9" height="90.9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="10.725" result="effect1_foregroundBlur_kvali_new" />
        </filter>
        <filter id="filter4_f_kvali_new" x="-13.45" y="-44.45" width="90.9" height="90.9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="10.725" result="effect1_foregroundBlur_kvali_new" />
        </filter>
        <filter id="filter5_f_kvali_new" x="10.55" y="-20.45" width="90.9" height="90.9" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="10.725" result="effect1_foregroundBlur_kvali_new" />
        </filter>
        <filter id="filter6_f_kvali_new" x="-9.775" y="-16.775" width="83.55" height="83.55" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="8.8875" result="effect1_foregroundBlur_kvali_new" />
        </filter>
        
        <radialGradient id="paint0_radial_kvali_new" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 25) rotate(90) scale(24)">
          <stop stopColor="white" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        
        <clipPath id="clip0_kvali_new">
          <rect x="8" y="1" width="48" height="48" rx="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default KvaliLogo;
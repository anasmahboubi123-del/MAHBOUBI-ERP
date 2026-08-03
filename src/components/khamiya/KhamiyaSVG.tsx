'use client';

import { useMemo } from 'react';

interface KhamiyaSVGProps {
  width: number; // in meters
  height: number; // in meters
  shape: 'cut_middle' | 'solid_piece';
  hasBottomFabric: boolean;
  aqaqWidth: number;
  scale?: number;
}

export default function KhamiyaSVG({
  width,
  height,
  shape,
  hasBottomFabric,
  aqaqWidth,
  scale = 40,
}: KhamiyaSVGProps) {
  const svgWidth = Math.max(width * scale, 200);
  const svgHeight = Math.max(height * scale, 150);
  
  const fabricColor = '#D4A574'; // لون قماش تقليدي
  const bottomFabricColor = '#F5E6D3';
  const aqaqColor = '#C9A227'; // ذهبي
  
  const cutLineX = shape === 'cut_middle' ? svgWidth / 2 : null;

  const aqaqDots = useMemo(() => {
    const dots = [];
    const dotSpacing = 15;
    const yPos = svgHeight - 20;
    const numDots = Math.floor((svgWidth - 20) / dotSpacing);
    for (let i = 0; i < numDots; i++) {
      dots.push({ cx: 10 + i * dotSpacing, cy: yPos });
    }
    return dots;
  }, [svgWidth, svgHeight]);

  return (
    <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100">
      <h3 className="text-amber-900 font-bold text-lg mb-4 text-center">معاينة الخامية</h3>
      <div className="flex justify-center">
        <svg
          width={svgWidth}
          height={svgHeight + 40}
          viewBox={`0 0 ${svgWidth} ${svgHeight + 40}`}
          className="drop-shadow-lg"
        >
          {/* Definitions for patterns */}
          <defs>
            <pattern id="fabricPattern" patternUnits="userSpaceOnUse" width="20" height="20">
              <rect width="20" height="20" fill={fabricColor} />
              <line x1="0" y1="10" x2="20" y2="10" stroke="#C49A6C" strokeWidth="0.5" opacity="0.5" />
              <line x1="10" y1="0" x2="10" y2="20" stroke="#C49A6C" strokeWidth="0.5" opacity="0.5" />
            </pattern>
            <pattern id="bottomPattern" patternUnits="userSpaceOnUse" width="10" height="10">
              <rect width="10" height="10" fill={bottomFabricColor} />
              <circle cx="5" cy="5" r="1" fill="#E0D0C0" />
            </pattern>
          </defs>

          {/* Main fabric body */}
          <rect
            x="5"
            y="5"
            width={svgWidth - 10}
            height={svgHeight - 10}
            fill="url(#fabricPattern)"
            stroke="#8B6914"
            strokeWidth="2"
            rx="4"
          />

          {/* Cut in middle line */}
          {cutLineX && (
            <>
              <line
                x1={cutLineX}
                y1="5"
                x2={cutLineX}
                y2={svgHeight - 5}
                stroke="#DC2626"
                strokeWidth="2"
                strokeDasharray="8,4"
              />
              <text
                x={cutLineX}
                y={svgHeight / 2}
                fill="#DC2626"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                transform={`rotate(-90, ${cutLineX}, ${svgHeight / 2})`}
              >
                قص من الوسط
              </text>
            </>
          )}

          {/* Bottom fabric layer */}
          {hasBottomFabric && (
            <rect
              x="10"
              y={svgHeight - 30}
              width={svgWidth - 20}
              height="20"
              fill="url(#bottomPattern)"
              stroke="#D4A574"
              strokeWidth="1"
              opacity="0.9"
            />
          )}

          {/* Aqaq (beads/accessories) */}
          {aqaqWidth > 0 && (
            <g>
              <text x={svgWidth / 2} y={svgHeight + 15} fill="#8B6914" fontSize="11" textAnchor="middle">
                عقاق ({aqaqWidth}م)
              </text>
              {aqaqDots.map((dot, i) => (
                <circle
                  key={i}
                  cx={dot.cx}
                  cy={dot.cy}
                  r="3"
                  fill={aqaqColor}
                  stroke="#B8860B"
                  strokeWidth="0.5"
                />
              ))}
            </g>
          )}

          {/* Dimensions labels */}
          <text x={svgWidth / 2} y="-5" fill="#5D4037" fontSize="12" fontWeight="bold" textAnchor="middle">
            العرض: {width}م
          </text>
          <text
            x="0"
            y={svgHeight / 2}
            fill="#5D4037"
            fontSize="12"
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(-90, 0, ${svgHeight / 2})`}
          >
            الارتفاع: {height}م
          </text>
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs text-amber-800">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-[#D4A574]" />
          <span>القماش الرئيسي</span>
        </div>
        {hasBottomFabric && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#F5E6D3]" />
            <span>الطبقة السفلية</span>
          </div>
        )}
        {aqaqWidth > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#C9A227]" />
            <span>العقاق</span>
          </div>
        )}
      </div>
    </div>
  );
}
// A drawn dinner table seen from above: shakshuka in a pan, a salad bowl, bread and cutlery.
// The table and dishes follow the theme; the food keeps its own colors in light and dark.
import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { color } from '../theme';

const SAUCE = '#D65A3C';
const SAUCE_DARK = '#B8432A';
const YOLK = '#F5B731';
const WHITE = '#FFF8EE';
const HERB = '#5E9E6B';
const LEAF = '#7DB86A';
const TOMATO = '#E2553F';
const BREAD = '#E4B46C';
const CRUST = '#B9803A';

function Egg({ x, y }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={17} ry={15} fill={WHITE} />
      <Circle cx={x + 1} cy={y - 1} r={7.5} fill={YOLK} />
      <Circle cx={x - 1} cy={y - 3} r={2.2} fill="#FFE29A" />
    </G>
  );
}

/** Fills its box; `height` sets the size, the width follows the parent. */
export default function FoodArt({ height = 220, radius = 28 }) {
  return (
    <View style={{ height, borderRadius: radius, overflow: 'hidden', backgroundColor: color.plate }}>
      <Svg width="100%" height="100%" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" accessible={false}>
        {/* table cloth stripes */}
        <Rect x="0" y="0" width="360" height="220" fill={color.plate} />
        {[0, 1, 2, 3, 4, 5].map(i => <Rect key={i} x={i * 64 - 10} y="0" width="22" height="220" fill={color.plateDot} opacity="0.08" />)}

        {/* fork and knife */}
        <G opacity="0.9">
          <Rect x="28" y="52" width="9" height="120" rx="4.5" fill={color.muted} />
          <Rect x="22" y="40" width="4" height="34" rx="2" fill={color.muted} />
          <Rect x="30.5" y="40" width="4" height="34" rx="2" fill={color.muted} />
          <Rect x="39" y="40" width="4" height="34" rx="2" fill={color.muted} />
          <Path d="M58 40 C70 50 70 90 64 104 L64 172 A4.5 4.5 0 0 1 55 172 L55 44 Z" fill={color.muted} />
        </G>

        {/* pan with shakshuka */}
        <Rect x="222" y="104" width="70" height="16" rx="8" fill="#3B3436" transform="rotate(-28 222 112)" />
        <Circle cx="160" cy="118" r="78" fill="#3B3436" />
        <Circle cx="160" cy="118" r="70" fill={SAUCE_DARK} />
        <Circle cx="160" cy="118" r="64" fill={SAUCE} />
        {[[128, 86], [196, 104], [150, 150], [184, 152], [118, 128], [172, 76]].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={i % 2 ? 4 : 3} fill={SAUCE_DARK} opacity="0.7" />
        ))}
        <Egg x={136} y={102} />
        <Egg x={186} y={128} />
        <Egg x={142} y={150} />
        {[[166, 96], [118, 140], [196, 96], [172, 160], [158, 124], [124, 112]].map(([x, y], i) => (
          <Ellipse key={i} cx={x} cy={y} rx={4} ry={2} fill={HERB} transform={`rotate(${i * 37} ${x} ${y})`} />
        ))}

        {/* salad bowl */}
        <Circle cx="300" cy="58" r="44" fill={color.surface} />
        <Circle cx="300" cy="58" r="36" fill={color.accentSoft} />
        {[[284, 44, 20], [312, 48, -30], [296, 70, 60], [318, 68, 10], [290, 58, -60]].map(([x, y, r], i) => (
          <Ellipse key={i} cx={x} cy={y} rx={13} ry={7} fill={i % 2 ? LEAF : HERB} transform={`rotate(${r} ${x} ${y})`} />
        ))}
        <Circle cx="306" cy="40" r="6" fill={TOMATO} />
        <Circle cx="282" cy="70" r="5" fill={TOMATO} />
        <Circle cx="314" cy="62" r="4" fill="#FFF3D6" />

        {/* bread */}
        <G transform="rotate(14 304 168)">
          <Rect x="268" y="146" width="72" height="44" rx="18" fill={CRUST} />
          <Rect x="273" y="151" width="62" height="34" rx="14" fill={BREAD} />
          {[288, 304, 320].map(x => <Path key={x} d={`M${x} 156 L${x - 6} 180`} stroke={CRUST} strokeWidth="3" strokeLinecap="round" />)}
        </G>

        {/* loose herbs */}
        {[[92, 196, 30], [246, 196, -20], [84, 34, 70], [226, 24, -40]].map(([x, y, r], i) => (
          <Ellipse key={i} cx={x} cy={y} rx={9} ry={4.5} fill={LEAF} transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </Svg>
    </View>
  );
}

// Drawn tables seen from above, one for each meal, shown when a recipe has no photo:
// breakfast fried eggs with toast and salad, a lunch steak with potatoes, a dinner salmon fillet
// with asparagus and rice, a snack of hummus, vegetables and grapes, and a dessert of layered cake, a cupcake,
// cookies and sprinkles. Without a meal it's the general table: shakshuka, salad and bread.
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
const COFFEE = '#6B3E26';
const CREMA = '#C08A5B';
const HUMMUS = '#E9D2A6';
const HUMMUS_DARK = '#D4B47C';
const OIL = '#E6C34A';
const PAPRIKA = '#C8442C';
const CARROT = '#F08A33';
const CUCUMBER = '#8CC07A';
const GRAPE = '#7B4A8F';
const GRAPE_LIGHT = '#9A68AD';
const CHICKPEA = '#E8C483';
const CREAM = '#FFF4F0';
const CAKE = '#F2A7B8';
const CAKE_IN = '#F8D0D8';
const SPONGE = '#F4D49A';
const STRAWBERRY = '#E2445C';
const COOKIE = '#D9A15E';
const CHIP = '#5A3523';
const STEAK = '#9A4E30';
const STEAK_EDGE = '#6E3220';
const GRILL = '#4A2316';
const POTATO = '#E9B44C';
const SALMON = '#F28A62';
const SALMON_SKIN = '#C9C3BE';
const SALMON_FAT = '#FCD2BF';

function Egg({ x, y }) {
  return (
    <G>
      <Ellipse cx={x} cy={y} rx={17} ry={15} fill={WHITE} />
      <Circle cx={x + 1} cy={y - 1} r={7.5} fill={YOLK} />
      <Circle cx={x - 1} cy={y - 3} r={2.2} fill="#FFE29A" />
    </G>
  );
}

/** A round cup seen from above, on its saucer, with a handle. */
function Cup({ x, y, drink, top }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={34} fill={color.surface} />
      <Rect x={x + 24} y={y - 6} width={20} height={12} rx={6} fill={color.surface} />
      <Circle cx={x} cy={y} r={25} fill={color.line} />
      <Circle cx={x} cy={y} r={21} fill={drink} />
      {top ? <Circle cx={x - 3} cy={y - 3} r={11} fill={top} opacity="0.75" /> : null}
    </G>
  );
}

function Cutlery({ spoon }) {
  return (
    <G opacity="0.9">
      {spoon ? (
        <>
          <Ellipse cx="32" cy="58" rx="11" ry="16" fill={color.muted} />
          <Rect x="28" y="70" width="8" height="102" rx="4" fill={color.muted} />
        </>
      ) : (
        <>
          <Rect x="28" y="52" width="9" height="120" rx="4.5" fill={color.muted} />
          <Rect x="22" y="40" width="4" height="34" rx="2" fill={color.muted} />
          <Rect x="30.5" y="40" width="4" height="34" rx="2" fill={color.muted} />
          <Rect x="39" y="40" width="4" height="34" rx="2" fill={color.muted} />
        </>
      )}
      <Path d="M58 40 C70 50 70 90 64 104 L64 172 A4.5 4.5 0 0 1 55 172 L55 44 Z" fill={color.muted} />
    </G>
  );
}

function Herbs({ spots, fill = LEAF }) {
  return spots.map(([x, y, r], i) => <Ellipse key={i} cx={x} cy={y} rx={9} ry={4.5} fill={fill} transform={`rotate(${r} ${x} ${y})`} />);
}

/** The general table: shakshuka, salad and bread. For screens that aren't about one recipe. */
function Table() {
  return (
    <G>
      <Cutlery />
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
      <Herbs spots={[[92, 196, 30], [246, 196, -20], [84, 34, 70], [226, 24, -40]]} />
    </G>
  );
}

/** A fried egg: a wavy white with a round yolk. */
function FriedEgg({ x, y, r = 1 }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${r})`}>
      <Path d="M-30 -4 C-32 -22 -12 -30 2 -26 C18 -30 34 -18 30 0 C34 16 18 30 0 26 C-16 30 -34 16 -30 -4 Z" fill={WHITE} />
      <Circle cx={2} cy={-1} r={11} fill={YOLK} />
      <Circle cx={-1} cy={-4} r={3.5} fill="#FFE29A" />
    </G>
  );
}

function Breakfast() {
  return (
    <G>
      <Cutlery />
      {/* plate with two fried eggs and toast */}
      <Circle cx="160" cy="116" r="80" fill={color.surface} />
      <Circle cx="160" cy="116" r="70" fill={color.line} opacity="0.5" />
      <FriedEgg x={136} y={104} />
      <FriedEgg x={176} y={136} r={0.95} />
      <G transform="rotate(-18 196 82)">
        <Rect x="172" y="58" width="50" height="48" rx="12" fill={CRUST} />
        <Rect x="177" y="63" width="40" height="38" rx="9" fill={BREAD} />
      </G>
      {[[126, 150, -30], [138, 160, 10]].map(([x, y, r], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={8} ry={4} fill={HERB} transform={`rotate(${r} ${x} ${y})`} />
      ))}
      {[[148, 82], [190, 112]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={1.6} fill="#2E2A2B" />)}

      <Cup x={300} y={58} drink={COFFEE} top={CREMA} />

      {/* a small bowl of chopped tomato and cucumber salad */}
      <Circle cx="302" cy="168" r="38" fill={color.surface} />
      <Circle cx="302" cy="168" r="30" fill={color.accentSoft} />
      {[[290, 156, TOMATO], [306, 152, CUCUMBER], [318, 164, TOMATO], [296, 172, CUCUMBER], [312, 180, TOMATO], [286, 184, CUCUMBER], [304, 166, TOMATO]].map(([x, y, c], i) => (
        <Rect key={i} x={x - 5} y={y - 5} width={10} height={10} rx={2.5} fill={c} transform={`rotate(${i * 23} ${x} ${y})`} />
      ))}
      <Herbs spots={[[92, 196, 30], [236, 24, -40]]} />
    </G>
  );
}

function Lunch() {
  return (
    <G>
      <Cutlery />
      {/* plate with a grilled steak, roast potatoes and green beans */}
      <Circle cx="160" cy="116" r="80" fill={color.surface} />
      <Circle cx="160" cy="116" r="70" fill={color.line} opacity="0.5" />
      <G transform="rotate(-12 150 104)">
        <Path d="M104 96 C102 70 140 62 166 68 C196 74 206 98 196 120 C186 140 150 144 126 136 C108 130 106 112 104 96 Z" fill={STEAK_EDGE} />
        <Path d="M112 96 C111 76 142 70 164 75 C189 80 197 99 189 117 C181 133 151 136 130 129 C115 124 113 110 112 96 Z" fill={STEAK} />
        {[0, 1, 2, 3].map(i => <Path key={i} d={`M${122 + i * 20} 74 L${108 + i * 20} 132`} stroke={GRILL} strokeWidth="5" strokeLinecap="round" opacity="0.8" />)}
      </G>
      {[[140, 162], [160, 168], [180, 160]].map(([x, y], i) => (
        <G key={i}>
          <Ellipse cx={x} cy={y} rx={12} ry={10} fill={POTATO} transform={`rotate(${i * 30} ${x} ${y})`} />
          <Circle cx={x - 3} cy={y - 2} r={2} fill={CRUST} />
          <Circle cx={x + 4} cy={y + 3} r={1.5} fill={CRUST} />
        </G>
      ))}
      {[0, 1, 2, 3, 4].map(i => (
        <Rect key={i} x={196} y={118 + i * 7} width={36} height={6} rx={3} fill={i % 2 ? HERB : LEAF} transform={`rotate(${-40 + i * 4} 214 ${121 + i * 7})`} />
      ))}
      {/* a sprig of rosemary on the steak */}
      <Path d="M140 92 L176 84" stroke={HERB} strokeWidth="2.5" strokeLinecap="round" />
      {[0, 1, 2, 3, 4].map(i => <Ellipse key={i} cx={146 + i * 7} cy={90 - i * 1.5} rx={5} ry={1.8} fill={HERB} transform={`rotate(${i % 2 ? 40 : -40} ${146 + i * 7} ${90 - i * 1.5})`} />)}

      {/* salad bowl */}
      <Circle cx="300" cy="58" r="44" fill={color.surface} />
      <Circle cx="300" cy="58" r="36" fill={color.accentSoft} />
      {[[284, 44, 20], [312, 48, -30], [296, 70, 60], [318, 68, 10], [290, 58, -60]].map(([x, y, r], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={13} ry={7} fill={i % 2 ? LEAF : HERB} transform={`rotate(${r} ${x} ${y})`} />
      ))}
      <Circle cx="306" cy="40" r="6" fill={TOMATO} />
      <Circle cx="282" cy="70" r="5" fill={TOMATO} />

      {/* bread */}
      <G transform="rotate(14 304 168)">
        <Rect x="268" y="146" width="72" height="44" rx="18" fill={CRUST} />
        <Rect x="273" y="151" width="62" height="34" rx="14" fill={BREAD} />
        {[288, 304, 320].map(x => <Path key={x} d={`M${x} 156 L${x - 6} 180`} stroke={CRUST} strokeWidth="3" strokeLinecap="round" />)}
      </G>
      <Herbs spots={[[92, 196, 30], [246, 200, -20], [236, 24, -40]]} />
    </G>
  );
}

function Dinner() {
  return (
    <G>
      <Cutlery />
      {/* plate with a salmon fillet, lemon and dill, asparagus and rice */}
      <Circle cx="160" cy="116" r="80" fill={color.surface} />
      <Circle cx="160" cy="116" r="70" fill={color.line} opacity="0.5" />
      <G transform="rotate(-14 150 100)">
        <Rect x="100" y="74" width="104" height="52" rx="20" fill={SALMON_SKIN} />
        <Rect x="104" y="77" width="96" height="46" rx="18" fill={SALMON} />
        {[0, 1, 2, 3, 4].map(i => (
          <Path key={i} d={`M${118 + i * 18} 80 C${124 + i * 18} 92 ${112 + i * 18} 106 ${120 + i * 18} 120`} stroke={SALMON_FAT} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.9" />
        ))}
        <Circle cx="170" cy="98" r="13" fill="#F2D33C" />
        <Circle cx="170" cy="98" r="10.5" fill="#FBEA8C" />
        {[0, 60, 120].map(a => <Rect key={a} x={169.4} y={88} width={1.2} height={20} fill="#F2D33C" transform={`rotate(${a} 170 98)`} />)}
        {[[136, 90], [146, 106], [128, 104]].map(([x, y], i) => (
          <G key={i}>
            <Path d={`M${x - 8} ${y} L${x + 8} ${y}`} stroke={HERB} strokeWidth="1.5" strokeLinecap="round" />
            {[-6, -2, 2, 6].map(dx => <Path key={dx} d={`M${x + dx} ${y} l-3 -4 M${x + dx} ${y} l-3 4`} stroke={HERB} strokeWidth="1.2" strokeLinecap="round" />)}
          </G>
        ))}
      </G>
      {/* asparagus */}
      {[0, 1, 2, 3].map(i => (
        <G key={i} transform={`rotate(${-8 + i * 3} 170 ${150 + i * 8})`}>
          <Rect x={122} y={146 + i * 8} width={72} height={6} rx={3} fill={i % 2 ? HERB : LEAF} />
          <Ellipse cx={196} cy={149 + i * 8} rx={7} ry={4} fill={HERB} />
        </G>
      ))}
      {/* rice */}
      <Ellipse cx="206" cy="120" rx="22" ry="18" fill={WHITE} />
      {[[198, 112], [210, 116], [204, 126], [214, 126], [196, 124]].map(([x, y], i) => <Ellipse key={i} cx={x} cy={y} rx={3} ry={1.5} fill="#EADFCB" transform={`rotate(${i * 40} ${x} ${y})`} />)}

      {/* salad bowl */}
      <Circle cx="300" cy="58" r="44" fill={color.surface} />
      <Circle cx="300" cy="58" r="36" fill={color.accentSoft} />
      {[[284, 44, 20], [312, 48, -30], [296, 70, 60], [318, 68, 10], [290, 58, -60]].map(([x, y, r], i) => (
        <Ellipse key={i} cx={x} cy={y} rx={13} ry={7} fill={i % 2 ? LEAF : HERB} transform={`rotate(${r} ${x} ${y})`} />
      ))}
      <Circle cx="306" cy="40" r="6" fill={TOMATO} />
      <Circle cx="314" cy="62" r="4" fill="#FFF3D6" />

      {/* lemon halves */}
      {[[292, 172], [330, 186]].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={20} fill="#F2D33C" />
          <Circle cx={x} cy={y} r={16} fill="#FBEA8C" />
          {[0, 45, 90, 135].map(a => <Rect key={a} x={x - 0.6} y={y - 15} width={1.2} height={30} fill="#F2D33C" transform={`rotate(${a} ${x} ${y})`} />)}
        </G>
      ))}
      <Herbs spots={[[92, 196, 30], [246, 200, -20], [236, 24, -40]]} />
    </G>
  );
}

function Snack() {
  return (
    <G>
      {/* hummus with oil, paprika and chickpeas */}
      <Circle cx="140" cy="112" r="66" fill={color.surface} />
      <Circle cx="140" cy="112" r="56" fill={HUMMUS} />
      <Path d="M140 76 C176 78 178 120 150 132 C124 142 104 120 114 100 C122 86 142 90 144 104" fill="none" stroke={HUMMUS_DARK} strokeWidth="6" strokeLinecap="round" />
      <Circle cx="142" cy="110" r="12" fill={OIL} opacity="0.8" />
      {[[122, 92], [160, 124], [132, 132], [158, 92]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.5} fill={PAPRIKA} />)}
      {[[136, 106], [148, 114], [142, 100]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={5} fill={CHICKPEA} />)}

      {/* carrot and cucumber sticks */}
      {[[40, 60, -20, CARROT], [56, 78, -12, CUCUMBER], [34, 98, -26, CARROT], [52, 120, -16, CUCUMBER], [38, 146, -22, CARROT]].map(([x, y, r, c], i) => (
        <Rect key={i} x={x} y={y} width={58} height={11} rx={5.5} fill={c} transform={`rotate(${r} ${x} ${y})`} />
      ))}

      {/* grapes */}
      {[[282, 44], [300, 40], [318, 46], [272, 62], [290, 60], [308, 62], [326, 64], [282, 80], [300, 80], [318, 82], [292, 98], [310, 98]].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={10} fill={i % 3 ? GRAPE : GRAPE_LIGHT} />
          <Circle cx={x - 3} cy={y - 3} r={2.5} fill="#C9A6D6" opacity="0.8" />
        </G>
      ))}
      <Path d="M300 30 L304 18" stroke={HERB} strokeWidth="4" strokeLinecap="round" />

      {/* crackers */}
      {[[244, 164, 10], [292, 176, -14], [334, 160, 22]].map(([x, y, r], i) => (
        <G key={i} transform={`rotate(${r} ${x} ${y})`}>
          <Rect x={x - 20} y={y - 20} width={40} height={40} rx={6} fill={BREAD} />
          {[-8, 8].map(dx => [-8, 8].map(dy => <Circle key={`${dx}${dy}`} cx={x + dx} cy={y + dy} r={2} fill={CRUST} />))}
        </G>
      ))}
      <Herbs spots={[[92, 196, 30], [226, 24, -40], [214, 112, 60]]} />
    </G>
  );
}

function Dessert() {
  return (
    <G>
      <Cutlery spoon />
      {/* plate with a slice of layered cake, seen from the side, a strawberry on top */}
      <Circle cx="160" cy="116" r="80" fill={color.surface} />
      <Circle cx="160" cy="116" r="70" fill={color.line} opacity="0.5" />
      <Ellipse cx="158" cy="166" rx="56" ry="8" fill={color.line} />
      <Path d="M106 112 L210 112 L160 70 Z" fill={CAKE} />
      <Rect x="106" y="112" width="104" height="54" fill={SPONGE} />
      <Rect x="106" y="112" width="104" height="9" fill={CAKE} />
      <Rect x="106" y="131" width="104" height="7" fill={CREAM} />
      <Rect x="106" y="138" width="104" height="4" fill={STRAWBERRY} opacity="0.8" />
      <Rect x="106" y="152" width="104" height="7" fill={CREAM} />
      {[[124, 112], [144, 112], [164, 112], [184, 112], [202, 112]].map(([x, y], i) => <Circle key={i} cx={x} cy={y + 2} r={5} fill={CAKE} />)}
      <Circle cx="152" cy="80" r="9" fill={CREAM} />
      <Path d="M150 84 C138 84 140 66 152 64 C164 66 166 84 154 84 Z" fill={STRAWBERRY} />
      <Path d="M146 66 L152 60 L158 66" stroke={HERB} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[[146, 74], [156, 72], [151, 79]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={1} fill="#FFE0E5" />)}

      {/* cupcake */}
      <Path d="M276 62 L326 62 L318 104 L284 104 Z" fill="#8FC3E8" />
      {[286, 296, 306, 316].map(x => <Path key={x} d={`M${x} 62 L${x - 2} 104`} stroke="#6FA8D2" strokeWidth="2.5" />)}
      <Ellipse cx="301" cy="58" rx="30" ry="12" fill={CAKE} />
      <Ellipse cx="301" cy="46" rx="22" ry="10" fill={CAKE_IN} />
      <Ellipse cx="301" cy="36" rx="13" ry="8" fill={CAKE} />
      <Circle cx="301" cy="24" r="7" fill={STRAWBERRY} />
      <Path d="M301 18 Q304 10 310 8" stroke={HERB} strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* cookies */}
      {[[288, 172], [330, 186]].map(([x, y], i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={22} fill={COOKIE} />
          {[[-8, -6], [6, -10], [8, 6], [-6, 9], [0, 0]].map(([dx, dy], j) => <Circle key={j} cx={x + dx} cy={y + dy} r={3} fill={CHIP} />)}
        </G>
      ))}

      {/* sprinkles on the table */}
      {[[96, 30, '#F2A7B8', 20], [236, 40, '#8FC3E8', -30], [250, 120, '#F2D33C', 60], [92, 196, '#7DB86A', -10], [236, 196, '#F2A7B8', 40], [252, 160, '#8FC3E8', 80], [226, 84, '#F2D33C', -60], [110, 206, '#E2445C', 10]].map(([x, y, c, r], i) => (
        <Rect key={i} x={x - 6} y={y - 2} width={12} height={4} rx={2} fill={c} transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </G>
  );
}

const SCENES = { table: Table, breakfast: Breakfast, lunch: Lunch, dinner: Dinner, snack: Snack, dessert: Dessert };

/**
 * Fills its box; `height` sets the size, the width follows the parent.
 * `meal` picks the scene (breakfast, lunch, dinner, snack or dessert); without one it's the
 * general table with shakshuka.
 */
export default function FoodArt({ height = 220, radius = 28, meal = 'table' }) {
  const Scene = SCENES[meal] || Table;
  return (
    <View style={{ height, borderRadius: radius, overflow: 'hidden', backgroundColor: color.plate }}>
      <Svg width="100%" height="100%" viewBox="0 0 360 220" preserveAspectRatio="xMidYMid slice" accessible={false}>
        {/* table cloth stripes */}
        <Rect x="0" y="0" width="360" height="220" fill={color.plate} />
        {[0, 1, 2, 3, 4, 5].map(i => <Rect key={i} x={i * 64 - 10} y="0" width="22" height="220" fill={color.plateDot} opacity="0.08" />)}
        <Scene />
      </Svg>
    </View>
  );
}

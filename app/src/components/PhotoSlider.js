// A recipe's photos, swiped one at a time, with a dot for each photo.
import React, { useState } from 'react';
import { Image, ScrollView, View } from 'react-native';

export default function PhotoSlider({ photos, height, radius, empty = null }) {
  const [width, setWidth] = useState(0);
  const [at, setAt] = useState(0);
  if (!photos?.length) return empty;
  return (
    // Left to right in every language, so the dots follow the swipe.
    <View style={{ height, borderRadius: radius, overflow: 'hidden', direction: 'ltr' }} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {width ? (
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => setAt(Math.round(e.nativeEvent.contentOffset.x / width))}>
          {photos.map((uri, i) => <Image key={uri + i} source={{ uri }} style={{ width, height }} resizeMode="cover" />)}
        </ScrollView>
      ) : null}
      {photos.length > 1 ? (
        <View style={{ position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 6, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 }}
          accessibilityLabel={`${at + 1} / ${photos.length}`}>
          {photos.map((_, i) => (
            <View key={i} style={{ width: i === at ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === at ? '#fff' : 'rgba(255,255,255,0.6)' }} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

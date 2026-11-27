import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  mapHtml,
  mapMessageSchema,
  type RestaurantMapProps,
} from '../utils/restaurant-map';

export function RestaurantMap(props: RestaurantMapProps) {
  const { restaurants, point, editable } = props;
  const [html] = useState(() => mapHtml({ restaurants, point, editable }));
  const webview = useRef<WebView<unknown>>(null);
  const update = () =>
    webview.current?.injectJavaScript(
      `window.updateRestaurantMap?.(${JSON.stringify({ restaurants, point, editable }).replace(/</g, '\\u003c')});true;`
    );
  useEffect(update, [restaurants, point, editable]);
  return (
    <View style={{ height: 290, overflow: 'hidden', borderRadius: 16 }}>
      <WebView<unknown>
        ref={webview}
        source={{ html, baseUrl: 'https://www.openstreetmap.org' }}
        onLoadEnd={update}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) =>
          request.url === 'about:blank' ||
          request.url === 'https://www.openstreetmap.org/'
        }
        onMessage={(event) => {
          try {
            const message = mapMessageSchema.parse(
              JSON.parse(event.nativeEvent.data)
            );
            if (message.type === 'pick' && props.editable)
              props.onPick?.(message);
            if (
              message.type === 'select' &&
              props.restaurants?.some((r) => r.pageUserId === message.id)
            )
              props.onSelect?.(message.id);
          } catch {
            /* Ignore messages outside the map contract. */
          }
        }}
      />
    </View>
  );
}

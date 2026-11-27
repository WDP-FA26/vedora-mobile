import { useEffect, useRef, useState } from 'react';
import {
  mapHtml,
  mapMessageSchema,
  type RestaurantMapProps,
} from '../utils/restaurant-map';

export function RestaurantMap(props: RestaurantMapProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const { restaurants, point, editable } = props;
  const [html] = useState(() => mapHtml({ restaurants, point, editable }));
  const update = () =>
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({
        type: 'update',
        data: { restaurants, point, editable },
      }),
      '*'
    );
  useEffect(update, [restaurants, point, editable]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      try {
        const message = mapMessageSchema.parse(JSON.parse(event.data));
        if (message.type === 'pick' && props.editable) props.onPick?.(message);
        if (
          message.type === 'select' &&
          props.restaurants?.some((r) => r.pageUserId === message.id)
        )
          props.onSelect?.(message.id);
      } catch {
        /* Ignore messages outside the map contract. */
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [props]);
  return (
    <iframe
      ref={frame}
      title="Bản đồ nhà hàng"
      srcDoc={html}
      onLoad={update}
      sandbox="allow-scripts"
      style={{ height: 290, width: '100%', border: 0, borderRadius: 16 }}
    />
  );
}

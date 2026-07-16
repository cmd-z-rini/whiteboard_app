// AlignUI notification host — vendored from https://alignui.com/docs/v1.2/ui/notification
// Changes vs. upstream: dropped the Next-only `'use client'` directive and rewrote
// `@/components/ui/notification` + `@/hooks/use-notification` to local relative paths.
// Mount this once near the app root; fire notifications with `notification()` from
// ./use-notification.

import * as Notification from './notification';
import { useNotification } from './use-notification';

const NotificationProvider = () => {
  const { notifications } = useNotification();

  return (
    <Notification.Provider>
      {notifications.map(({ id, ...rest }) => {
        return <Notification.Root key={id} {...rest} />;
      })}
      <Notification.Viewport />
    </Notification.Provider>
  );
};

export { NotificationProvider };

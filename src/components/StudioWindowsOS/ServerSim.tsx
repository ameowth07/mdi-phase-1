/** Server simulation viewport art — `public/assets/ServerSim.jpg` (main strip). */
import { publicAssetUrl } from '../../publicAssetUrl'

export type ServerSimProps = {
  /** Dock-only place server view (e.g. Level 1 in test mode). */
  variant?: 'default' | 'level-1'
  /** Level 1 server after a client joins the place. */
  hasJoinedClient?: boolean
}

function level1ServerAsset(hasJoinedClient: boolean): string {
  return hasJoinedClient
    ? 'assets/level-1-server-with-client.png'
    : 'assets/level-1-server.png'
}

export default function ServerSim({
  variant = 'default',
  hasJoinedClient = false,
}: ServerSimProps) {
  const src =
    variant === 'level-1'
      ? level1ServerAsset(hasJoinedClient)
      : 'assets/ServerSim.jpg'

  return (
    <img
      src={publicAssetUrl(src)}
      alt="Server simulation"
      data-name={
        variant === 'level-1'
          ? hasJoinedClient
            ? 'Level1ServerSimWithClient'
            : 'Level1ServerSim'
          : 'ServerSim'
      }
    />
  )
}

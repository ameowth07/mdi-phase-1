/** Server simulation viewport art — design export at `public/assets/ServerSim.jpg`. */
import { publicAssetUrl } from '../../publicAssetUrl'

export default function ServerSim() {
  return (
    <img
      src={publicAssetUrl('assets/ServerSim.jpg')}
      alt="Server simulation"
      data-name="ServerSim"
    />
  )
}

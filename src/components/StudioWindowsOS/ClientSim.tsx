/** Client simulation viewport art — design export at `public/assets/ClientSim.jpg`. */
import { publicAssetUrl } from '../../publicAssetUrl'

export default function ClientSim() {
  return (
    <img
      src={publicAssetUrl('assets/ClientSim.jpg')}
      alt="Client simulation"
      data-name="ClientSim"
    />
  )
}

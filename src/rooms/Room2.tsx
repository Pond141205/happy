import ConservatoryShell from './ConservatoryShell';
import BirthdayInstallation from './BirthdayInstallation';
import ForestEnvironment from './ForestEnvironment';
export default function Room2({ onReflectionsReady, ...props }: { decorationPath?: string; reduced: boolean; out: boolean; onReflectionsReady?: () => void }) {
  return <group name="room-2-birthday"><ForestEnvironment /><ConservatoryShell onReflectionsReady={onReflectionsReady}><BirthdayInstallation {...props} /></ConservatoryShell></group>;
}

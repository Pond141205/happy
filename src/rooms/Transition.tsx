import { Arch, Box } from './architecture';
export default function Transition({ z }: { z: number }) {
  return <group position={[0, 0, z]} name="intentional-connecting-passage">
    <Box at={[0, -.045, 0]} size={[2.8, .1, 4]} color="#b4a88c" />
    {[-1, 1].map(side => <group key={side}><Box at={[side * 1.49, 2.6, 0]} size={[.2, 5.2, 4]} color="#545f4c" /><Box at={[side * 1.36, .57, 0]} size={[.07, 1.14, 4]} color="#d7cdb6" /><Box at={[side * 1.3, 1.17, 0]} size={[.1, .06, 4]} color="#b6a06c" metalness={.6} /></group>)}
    <Box at={[0, 5.1, 0]} size={[3, .15, 4]} color="#d6cdb7" />
    {[-1.85, 0, 1.85].map(at => <Arch key={at} radius={1.32} spring={3.3} z={at} />)}
    <Box at={[0, .011, 0]} size={[.018, .008, 4]} color="#c7aa6d" metalness={.7} />
    <pointLight position={[0, 3.8, .8]} intensity={8} distance={6} color="#ffe4b9" /><pointLight position={[0, 3.8, -1.3]} intensity={5} distance={5} color="#b8c3d6" />
  </group>;
}

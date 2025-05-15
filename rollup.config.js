import { terser } from 'rollup-plugin-terser'

export default {
  input: 'index.js',
  output: [
    {
      file: 'dist/ipfs-smart-gateway.umd.js',
      format: 'umd',
      name: 'IPFSGatewaySelector',
      exports: 'named',
      sourcemap: true
    },
    {
      file: 'dist/ipfs-smart-gateway.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [terser()]
}

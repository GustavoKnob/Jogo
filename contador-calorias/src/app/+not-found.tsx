import { Redirect } from 'expo-router';

// Qualquer endereço desconhecido volta para a tela inicial.
export default function NaoEncontrado() {
  return <Redirect href="/" />;
}

import { authApi } from "./auth";
import { consultasApi } from "./consultas";
import { gruposApi } from "./grupos";
import { mensageriaApi } from "./mensageria";
import { pacientesApi } from "./pacientes";
import { sessaoApi } from "./sessao";
import { usuariosApi } from "./usuarios";

const api = {
  ...authApi,
  ...consultasApi,
  ...pacientesApi,
  ...gruposApi,
  ...mensageriaApi,
  ...usuariosApi,
  ...sessaoApi,
};

export { api };
export default api;

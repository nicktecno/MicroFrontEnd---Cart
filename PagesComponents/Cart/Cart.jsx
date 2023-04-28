import React, { useState, useEffect } from "react";
import { useRef } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { Container, Row, Col } from "react-bootstrap";
import Accordion from "react-bootstrap/Accordion";
import ReactInputMask from "react-input-mask";

import notification from "../../services/notification";
import currencyFormat from "../../services/currencyFormat";

import Loading from "../../components/Loading";
import GoCheckout from "../../components/GoCheckout";
import ProductHorizontalBox from "../../components/ProductHorizontalBox";

import * as S from "./style";
import "bootstrap/dist/css/bootstrap.min.css";

import { AddressBook } from "@styled-icons/fa-solid/AddressBook";
import { Location } from "@styled-icons/fluentui-system-filled/Location";

import Axios from "axios";
import Geocode from "react-geocode";
import { ToastContainer } from "react-toastify";

function Cart({
  api,
  appMsLocationUrl,
  mktName,
  msLocation,
  setCartLength,
  AtualizarModalPagina,
  setAtualizarModalPagina,
  googleApiKey,
}) {
  const history = useRouter();

  const [cart, setCart] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [shippings, setShippings] = useState([]);
  const [shippingAtual, setShippingAtual] = useState([]);
  const [gopayment, setGoPayment] = useState(false);
  const [shippingselected, setShippingSelected] = useState(false);

  const [endereco, setEndereco] = useState(false);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoAtual, setEnderecoAtual] = useState();
  const [mudarEndereco, setMudarEndereco] = useState(false);
  const [novoEnderecoAtivo, setNovoEnderecoAtivo] = useState("inativo");

  const [loading, setLoading] = useState(true);
  const [loadingEnd, setLoadingEnd] = useState(false);

  const [desconto, setDesconto] = useState(false);
  const [cupom, setCupom] = useState("");
  const [shipmentChoice, setShipmentChoice] = useState({});
  const [adicionarEndereco, setAdicionarEndereco] = useState("inativo");
  const [nome, setNome] = useState("");
  const [cep, setCep] = useState("");
  const [enderecoForm, setEnderecoForm] = useState("");
  const [padrao, setDefault] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [pais, setPais] = useState("BR");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [telefone, setTelefone] = useState("");

  const refScrollAddress = useRef(null);
  const refScrollShip = useRef([]);

  const handleCadastrarLocalizacaoAtual = () => {
    setLoadingEnd(true);
    const url = appMsLocationUrl;

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      const { data: response } = await api.post(`${url}/location/geolocation`, {
        latitude: JSON.stringify(latitude),
        longitude: JSON.stringify(longitude),
      });
      setCep(response.zipcode);
      setBairro(response.neighborhood);
      setEstado(response.state);
      setCidade(response.city);
      setEnderecoForm(response.address);
    });
    setLoadingEnd(false);
  };

  async function handleCadastro() {
    const dataEndereco = {
      name: nome,
      postcode: cep.replace("-", ""),
      address: enderecoForm,
      number: numero,
      complement: complemento,
      neighborhood: bairro,

      country: pais,
      state: estado,
      city: cidade,
      phone:
        "+55" +
        telefone
          .replace("(", "")
          .replace(")", "")
          .replace(" ", "")
          .replace("-", ""),
      default_address: true,
    };

    try {
      const token = localStorage.getItem(mktName);
      if (token) {
        api.defaults.headers.Authorization = `Bearer ${token}`;
      } else {
        notification("Sua sessão expirou, faça o login novamente", "error");
        sessionStorage.setItem("urlantiga", window.location.href);

        setCartLength("0");
        setTimeout(function () {
          window.location.href = "/login";
        }, 3000);
      }

      const { data: response } = await api.post(
        "/customer/addresses/create",
        dataEndereco
      );

      if (response.message === "Your address has been created successfully.") {
        //history.push("/profile/addresses");

        if (sessionStorage.getItem("new") === "endereco") {
          sessionStorage.setItem(
            "tipo_endereco",
            padrao === "true" ? "true" : "false"
          );
          sessionStorage.removeItem("new");
          history.push("/cart");
        }

        if (sessionStorage.getItem("checkout") === "endereco") {
          sessionStorage.setItem(
            "tipo_endereco",
            padrao === "true" ? "true" : "false"
          );
          sessionStorage.removeItem("checkout");
          history.push("/checkout");
        }
        document.body.style.overflow = "auto";
        setAdicionarEndereco("inativo");
        setCidade("");
        setPais("BR");
        setEstado("");
        setBairro("");
        setEnderecoForm("");
        setCep("");
        setNome("");
        setNumero("");
        setComplemento("");
        setTelefone("");

        setAtualizarModalPagina(!AtualizarModalPagina);
      }
    } catch (err) {
      console.error(err);
    } finally {
    }
  }
  async function getPlacesCreate() {
    try {
      const { data: response } = await Axios.get(
        `https://viacep.com.br/ws/${cep}/json`
      );
      Geocode.setApiKey(googleApiKey);

      Geocode.setLanguage("pt-br");

      Geocode.setRegion("br");
      const GeoCodeComplete = await Geocode.fromAddress(
        `${response.logradouro}, ${response.bairro}, ${response.complemento}, ${response.localidade}, ${response.uf}`
      ).then(
        (response) => {
          return response;
        },
        (error) => {
          console.error(error);
        }
      );

      const morphLocation = {
        postalcode: response.cep.replace("-", ""),
        neighborhood: response.bairro,
        city: response.localidade,
        state: response.uf,
        street: response.logradouro,
        country: "Brasil",
        formatted_address: `${response.logradouro}, ${response.bairro}, ${response.localidade}, ${response.cep}, ${response.uf}`,
        coordinates: [
          {
            lat: String(GeoCodeComplete.results[0].geometry.location.lat),
            lng: String(GeoCodeComplete.results[0].geometry.location.lng),
          },
        ],
      };

      await msLocation.post(`location/auto-complete`, morphLocation);

      setCidade(response.localidade);
      setPais("Brasil");
      setEstado(response.uf);
      setBairro(response.bairro);
      setEnderecoForm(response.logradouro);
    } catch (e) {
      notification("Cep Inválido", "error");
    } finally {
    }
  }

  async function getCep() {
    const dataCep = {
      zipcode: cep.replace("-", ""),
    };
    try {
      const { data: response } = await msLocation.post(
        "/location/cep/search",
        dataCep
      );

      if (response.message === "CEP inválido ou ausente") {
        notification(response.message, "error");
        return false;
      }

      setCidade(response.city);
      setPais("BR");
      setEstado(response.state);
      setBairro(response.neighborhood);
      setEnderecoForm(response.address);
    } catch (err) {
      getPlacesCreate();
      console.error(err);
    } finally {
    }
  }

  // alteramos o endereço padrão
  const handleDefaultAddress = async (e) => {
    try {
      await api.put(`/customer/addresses/${novoEnderecoAtivo.id}`, {
        address: novoEnderecoAtivo.address,
        number: novoEnderecoAtivo.number,
        complement: novoEnderecoAtivo.complement,
        country: novoEnderecoAtivo.country,
        state: novoEnderecoAtivo.state,
        city: novoEnderecoAtivo.city,
        neighborhood: novoEnderecoAtivo.neighborhood,
        postcode: novoEnderecoAtivo.postcode,
        phone: novoEnderecoAtivo.phone,
        default_address: true,
        name: novoEnderecoAtivo.name,
      });

      setEnderecoAtual({
        address: novoEnderecoAtivo.address,
        number: novoEnderecoAtivo.number,
        complement: novoEnderecoAtivo.complement,
        country: novoEnderecoAtivo.country,
        state: novoEnderecoAtivo.state,
        city: novoEnderecoAtivo.city,
        neighborhood: novoEnderecoAtivo.neighborhood,
        postcode: novoEnderecoAtivo.postcode,
        phone: novoEnderecoAtivo.phone,
        default_address: true,
        name: novoEnderecoAtivo.name,
      });
      document.body.style.overflow = "auto";
      setMudarEndereco("inativo");

      getCart();

      notification("Você alterou seu endereço padrão de entrega.", "success");
    } finally {
    }
  };

  // pegamos o endereço padrão
  const getAddress = async (enderecoSalvoCarrinho = null) => {
    try {
      const { data: response } = await api.get("/customer/addresses");

      const endereco = response.data.find(
        (endereco) => endereco.default === true
      );
      setEnderecos(response.data);
      if (endereco.id) {
        setEnderecoAtual(endereco);

        if (
          enderecoSalvoCarrinho !== null &&
          endereco.postcode === enderecoSalvoCarrinho.postcode
        ) {
          handleFrete();
        } else {
          saveAddress(endereco.id);
        }

        setEndereco(true);
      } else {
        notification(
          "Você não possui nenhum endereço padrão de entrega, altere em seu perfil.",
          "error",
          4000
        );
        setEndereco(false);
      }
    } catch {
      notification(
        "Você não possui nenhum endereço cadastrado, por favor adicione um endereço em seu perfil.",
        "error",
        4000
      );
      setEndereco(false);
    }
  };

  // salvamos endereço no pedido
  const saveAddress = async (id = null) => {
    if (enderecoAtual && id === enderecoAtual.id) {
      return true;
    }

    try {
      const { data: response } = await api.post(
        "/customer/checkout/save-address",
        {
          billing: {
            address_id: id,
            use_for_shipping: true,
          },
          shipping: {},
        }
      );

      setCart(response.data);
      setSellers(Object.values(response.data.sellers));
      handleFrete();
    } catch (e) {
      console.log(e);
    }
  };

  // carregamos o frete
  async function handleFrete() {
    try {
      const { data: response } = await api.get(
        "/customer/checkout/cart/shipping/calculate"
      );

      setShippings(
        Object.entries(response).map((frete) => {
          return [
            frete[0],
            frete[1].map((i, index) => {
              return { ...i, index };
            }),
          ];
        })
      );

      setGoPayment(true);
    } catch (err) {
      setGoPayment(false);
    } finally {
      checkTerms();
    }
  }

  // salvamos o frete escolhido
  async function saveShipping(shipmentIndex, sellerId) {
    if (shipmentIndex !== undefined && sellerId) {
      let salvarFrete = {
        [parseInt(shipmentIndex)]: {
          seller: parseInt(sellerId),
          shipping: parseInt(shipmentIndex),
        },
      };

      try {
        const { data: response } = await api.post(
          "/customer/checkout/save-shipping",
          salvarFrete
        );
      } finally {
        getCart();
      }
    }
  }

  function showValueText(produto, atributo, manual = false) {
    const value = produto.find((attr) => attr.code === atributo);

    if (!manual && atributo === "installation_manual") {
      return false;
    }

    if (value && value.text_value) {
      return value.text_value;
    } else {
      return false;
    }
  }

  // remover item de carrinho
  const removeItem = async (product) => {
    window.dataLayer.push({
      event: "removeFromCart",
      ecommerce: {
        currencyCode: "BRL",
        remove: {
          products: [
            {
              name: product.name,
              id: String(product.id),
              price: product.price.slice(0, -2),
              brand: showValueText(product.product.attributes, "brand"),
              variant: product.sku,

              quantity: product.quantity,
            },
          ],
        },
      },
    });

    try {
      await api.get(`/customer/checkout/cart/remove-item/${product.id}`);

      getCart(cart.shipping_address ? cart.shipping_address : null);
      notification("Item removido com sucesso.", "success");
    } catch (e) {
      console.log(e.message);
    }
  };

  // adicionando desconto
  const handleDesconto = async () => {
    try {
      const returnCoupon = await api.post(`/customer/checkout/cart/coupon`, {
        code: cupom,
      });

      if (returnCoupon.data.success) {
        notification("Cupom adicionado com sucesso.", "success");
        setDesconto(true);
        getCart(cart.shipping_address ? cart.shipping_address : null);
      } else {
        notification("Cupom inválido", "error");
      }
    } catch {
      notification("Cupom inválido", "error");
    }
  };

  // removendo desconto
  const removeDesconto = async () => {
    try {
      await api.delete(`/customer/checkout/cart/coupon`);

      notification("Cupom removido com sucesso.", "success");

      setDesconto(false);
      setCupom();
      getCart(cart.shipping_address ? cart.shipping_address : null);
    } catch (e) {
      console.log(e.message);
    }
  };

  // atualizando quantidade
  const handleQtd = async (produto, qtd) => {
    try {
      await api.put(`/customer/checkout/cart/update`, {
        qty: {
          [produto]: qtd,
        },
      });

      setDesconto(false);
      setCupom();
      getCart();
      notification(`Quantidade do produto alterada`, "success");
    } catch (e) {
      console.log(e.message);
    }
  };

  // limpando carrinho

  const handleClear = async () => {
    try {
      await api.get(`/customer/checkout/cart/empty`);

      setDesconto(false);
      setCupom();
      setCartLength("0");

      notification(`Seu carrinho foi limpo`, "success");
      getCart();
    } catch (e) {
      console.log(e.message);
    }
  };

  useEffect(() => {
    if (
      shippingAtual !== null &&
      sellers !== null &&
      shippingAtual.length === sellers.length
    ) {
      setShippingSelected(true);
    } else {
      setShippingSelected(false);
    }
  }, [sellers, shippingAtual]);

  async function getCart() {
    setTimeout(2000);
    const token = localStorage.getItem(mktName);
    try {
      if (token) {
        api.defaults.headers.Authorization = `Bearer ${token}`;
      } else {
        notification("Sua sessão expirou, faça o login novamente", "error");
        sessionStorage.setItem("urlantiga", window.location.href);
        setCartLength("0");
        setTimeout(function () {
          window.location.href = "/login";
        }, 3000);
      }

      const { data: response } = await api.get("/customer/checkout/cart");

      if (response.data !== null && response.data.coupon_code) {
        setDesconto(true);
        setCupom(response.data.coupon_code);
      }

      if (response.data !== null && response.data.selected_shipping_rate) {
        setShippingAtual(Object.entries(response.data.selected_shipping_rate));
      }

      if (
        response.data !== null &&
        response.data.selected_shipping_rate &&
        response.data.selected_shipping
      ) {
        const selectedRates = Object.entries(
          response.data.selected_shipping_rate
        ).map((shipping, index) => {
          const ship = (shipmentChoice[index] = shipping[1].method_index);
          return setShipmentChoice(shipmentChoice);
        });
      }

      if (response.data !== null) {
        setCart(response.data);
        setCartLength(response.data.items_qty);
        setSellers(Object.values(response.data.sellers));
        getAddress(response.data.shipping_address);
        const productAttr = Object.values(response.data.sellers);

        const produto = productAttr.map((item) => item.items).flat();

        function undefinedFilter(value) {
          return value !== undefined;
        }

        const produtos = produto.map(function (itemDoItem) {
          const brand = itemDoItem.product.attributes
            .map(function (atributo) {
              if (atributo.code === "brand") {
                return atributo.value;
              } else {
                return;
              }
            })
            .filter(undefinedFilter);
          return {
            id: String(itemDoItem.product.id),
            name: itemDoItem.product.name,
            price: String(itemDoItem.price.slice(0, -2)),
            brand: brand[0] || "", // marca associada ao produto
          };
        });

        window.dataLayer.push({
          event: "checkout",
          pageCategory: "cart",
          pageTitle: "cart",
          ecommerce: {
            checkout: {
              actionField: { step: 1 },
              products: produtos,
            },
          },
        });
      } else {
        setCart([]);
        setCartLength("0");
        setSellers(null);
        getAddress();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // validar o frete atual com as opções
  function showShipping(frete, freteEscolhido, shippingAtual) {
    const value = shippingAtual.find((ship) => ship[0] === frete);

    if (
      value &&
      value[0] === frete &&
      freteEscolhido.carrier === value[1].carrier_title
    ) {
      return "selected";
    } else {
      return "";
      //  return false;
    }
  }

  const checkTerms = async () => {
    try {
      const loadedTerms = await api.get(`/customer/terms`);

      if (
        loadedTerms.data.data[0].accept == false ||
        loadedTerms.data.data[1].accept == false
      ) {
        await api.post("/customer/terms/accept", {
          code: "condition",
          accept: true,
        });
        await api.post("/customer/terms/accept", {
          code: "devolution",
          accept: true,
        });
      }
    } catch {
      notification(
        `Termos de aceite não encontrados, entre em contato com o administrador do sistema`,
        "error"
      );
    }
  };

  useEffect(() => {
    document.body.style.overflow = "auto";

    const token = localStorage.getItem(mktName);

    if (
      localStorage.getItem(`${mktName}_location`) &&
      sessionStorage.getItem("cart")
    ) {
      window.location.href = "/tcart";
      return false;
    } else if (
      !localStorage.getItem(`${mktName}_location`) &&
      sessionStorage.getItem("cart")
    ) {
      notification(
        "Faça sua geolocalização e entre no carrinho novamente para visulizá-lo",
        "error"
      );
    }

    if (token === null) {
      setCartLength("0");
      window.location.href = "/tcart";

      return false;
    }

    if (sessionStorage.getItem("tipo_endereco")) {
      if (sessionStorage.getItem("tipo_endereco") === "true") {
        notification(
          `Você cadastrou um novo endereço e ele já foi definido como padrão de entrega`,
          "success"
        );
      } else {
        notification(
          `Você cadastrou um endereço, mas ele não foi definido como padrão no cadastro`,
          "info"
        );
      }

      sessionStorage.removeItem("tipo_endereco");
    }

    getCart();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [AtualizarModalPagina]);

  const selectCheck = (seller) => {
    return shippingAtual?.filter((i) => {
      return +i[0] === +seller;
    }).length > 0
      ? false
      : true;
  };

  return (
    <>
      <S.buscando>
        <Container>
          <Row>
            <Col>
              <span>
                <h4>
                  {cart.items_qty && (
                    <>
                      {" "}
                      Carrinho de compras possui
                      <strong>
                        {parseInt(cart.items_qty) > 1
                          ? ` ${parseInt(cart.items_qty)} itens`
                          : ` ${parseInt(cart.items_qty)} item`}
                      </strong>
                    </>
                  )}
                </h4>
              </span>
            </Col>
          </Row>
        </Container>
      </S.buscando>

      {loading ? (
        <Loading />
      ) : cart.sellers ? (
        <>
          <S.ModalEscolherEndereco className={mudarEndereco}>
            <S.Transparente
              onClick={() => {
                document.body.style.overflow = "auto";
                setMudarEndereco("inativo");
              }}
            />
            <S.centroEscolherEndereco>
              <div className="cabecalho">Mudar Endereço</div>
              <div className="blocoGeral">
                <div className="blocoRolagem">
                  {enderecos.length > 0 ? (
                    enderecos.map((endereco, enderecoIndex) => (
                      <div key={enderecoIndex}>
                        {endereco.default && (
                          <button
                            disabled={endereco.default === true}
                            onClick={
                              !endereco.default
                                ? () => setNovoEnderecoAtivo(endereco)
                                : () => setNovoEnderecoAtivo(novoEnderecoAtivo)
                            }
                            key={endereco.id}
                            className={
                              endereco.default
                                ? "containerEnderecoDefault"
                                : novoEnderecoAtivo?.id === endereco.id
                                ? "novoEnderecoEscolhido"
                                : "containerEndereco"
                            }
                          >
                            <div className="containerImage">
                              <AddressBook />
                            </div>
                            <div className="containerDados">
                              <strong>{endereco.name}</strong>

                              <span>
                                {endereco.address} nº {endereco.number}{" "}
                                {endereco.complement}
                                <br />
                                {endereco.neighborhood} - {endereco.city}-
                                {endereco.state} - CEP: {endereco.postcode}
                              </span>
                            </div>
                          </button>
                        )}{" "}
                      </div>
                    ))
                  ) : (
                    <div className="SemEndereco">
                      Nenhum endereço cadastrado{" "}
                    </div>
                  )}
                  {enderecos &&
                    enderecos.map((endereco, enderecoIndex) => (
                      <div key={enderecoIndex}>
                        {!endereco.default && (
                          <button
                            disabled={endereco.default === true}
                            onClick={
                              !endereco.default
                                ? () => setNovoEnderecoAtivo(endereco)
                                : () => setNovoEnderecoAtivo(novoEnderecoAtivo)
                            }
                            key={endereco.id}
                            className={
                              endereco.default
                                ? "containerEnderecoDefault"
                                : novoEnderecoAtivo?.id === endereco.id
                                ? "novoEnderecoEscolhido"
                                : "containerEndereco"
                            }
                          >
                            <div className="containerImage">
                              <AddressBook />
                            </div>
                            <div className="containerDados">
                              <strong>{endereco.name}</strong>
                              <span>
                                {endereco.address} nº {endereco.number}{" "}
                                {endereco.complement}
                                <br />
                                {endereco.neighborhood} - {endereco.city}-
                                {endereco.state} - CEP: {endereco.postcode}
                              </span>
                            </div>
                          </button>
                        )}{" "}
                      </div>
                    ))}
                </div>
              </div>

              {enderecos.length > 0 ? (
                <>
                  <div className="containerBotoes">
                    <div
                      onClick={() => {
                        document.body.style.overflow = "auto";
                        setMudarEndereco("inativo");
                      }}
                      className="botaoNao negativeButton"
                    >
                      CANCELAR
                    </div>
                    <button
                      onClick={() => handleDefaultAddress()}
                      disabled={novoEnderecoAtivo === "inativo"}
                      className={
                        novoEnderecoAtivo !== "inativo"
                          ? "botaoSim positiveButton"
                          : "botaoDesativado positiveButton"
                      }
                    >
                      MUDAR
                    </button>
                  </div>
                  <br />
                  OU
                  <div
                    onClick={() => {
                      setAdicionarEndereco("ativo");
                      setMudarEndereco("inativo");
                    }}
                    className="cadastrarEndereco positiveButton"
                  >
                    CADASTRAR NOVO ENDEREÇO
                  </div>
                </>
              ) : (
                <div className="containerBotoesApenasCadastro">
                  <div
                    onClick={() => {
                      document.body.style.overflow = "auto";
                      setMudarEndereco("inativo");
                    }}
                    className="botaoNao negativeButton"
                  >
                    CANCELAR
                  </div>
                  <div
                    onClick={() => {
                      setAdicionarEndereco("ativo");
                      setMudarEndereco("inativo");
                    }}
                    className="botaoSim positiveButton"
                  >
                    CADASTRAR ENDEREÇO
                  </div>
                </div>
              )}
            </S.centroEscolherEndereco>
          </S.ModalEscolherEndereco>

          <S.ModalAtualizarAdicionar className={adicionarEndereco}>
            <S.Transparente
              onClick={() => {
                document.body.style.overflow = "auto";
                setAdicionarEndereco("inativo");
              }}
            />
            <S.centroAdicionarEndereco>
              <div className="cabecalho">Adicionar Endereço</div>
              <div className="title">
                {loadingEnd && (
                  <img
                    className="loading"
                    src="/images/gearAnimation.gif"
                    alt="Carregando"
                  />
                )}
                {!loadingEnd && (
                  <div
                    onClick={() => handleCadastrarLocalizacaoAtual()}
                    className="botaoLocalizacao positiveButton"
                  >
                    <Location />
                    USAR LOCALIZAÇÃO ATUAL
                  </div>
                )}
                <div className="containerDuplo">
                  <ReactInputMask
                    onBlur={() => getCep()}
                    placeholder="Digite o cep"
                    type="text"
                    mask="99999-999"
                    value={cep}
                    onChange={(event) => {
                      setCep(event.target.value);
                    }}
                  />
                  <input
                    maxLength="15"
                    type="text"
                    placeholder="Digite o apelido do endereço"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>

                <input
                  maxLength="35"
                  type="text"
                  placeholder="Rua, Avenida, Etc"
                  value={enderecoForm}
                  onChange={(e) => setEnderecoForm(e.target.value)}
                />
                <div className="containerDuplo">
                  <input
                    maxLength="20"
                    type="text"
                    placeholder="Digite o Nº"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                  />
                  <input
                    maxLength="30"
                    type="text"
                    placeholder="Digite o Complemento"
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                  />
                </div>
                <div className="containerDuplo">
                  <input
                    maxLength="20"
                    type="text"
                    placeholder="Digite o Bairro"
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                  />
                  <input
                    maxLength="20"
                    type="text"
                    placeholder="Digite a Cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>
                <div className="containerDuplo">
                  <input
                    maxLength="20"
                    type="text"
                    placeholder="Digite o Estado"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  />
                  <ReactInputMask
                    mask="(99) 9999-99999"
                    placeholder="Telefone/Celular"
                    type="text"
                    value={telefone.replace("+55", "")}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
              </div>
              <div className="containerBotoes">
                <div
                  onClick={() => {
                    document.body.style.overflow = "auto";
                    setAdicionarEndereco("inativo");
                  }}
                  className="botaoNao negativeButton"
                >
                  CANCELAR
                </div>
                <div
                  onClick={() => handleCadastro()}
                  className="botaoSim positiveButton"
                >
                  ADICIONAR
                </div>
              </div>
            </S.centroAdicionarEndereco>
          </S.ModalAtualizarAdicionar>

          <S.produtos>
            <Container className="containerBootstrap">
              {!endereco ? (
                <S.ContainerSemEndPadrao ref={refScrollAddress}>
                  <p>Você precisa ter um endereço padrão de entrega</p>
                  <div
                    onClick={() => {
                      document.body.style.overflow = "hidden";
                      setMudarEndereco("ativo");
                    }}
                    className="botaoSim positiveButton"
                  >
                    ADICIONAR
                  </div>
                </S.ContainerSemEndPadrao>
              ) : (
                <Row>
                  <Col>
                    <S.TitleEndereco>Endereço de Entrega</S.TitleEndereco>
                    <S.ContainerEndereco>
                      <div className="containerEsquerda">
                        <div className="containerImage">
                          <AddressBook />
                        </div>
                        <div className="containerDados">
                          <strong> {enderecoAtual.name}</strong>
                          <div className="containerEndereco">
                            {enderecoAtual.address} nº {enderecoAtual.number}{" "}
                            {enderecoAtual.complement}
                            <br />
                            {enderecoAtual.neighborhood} - {enderecoAtual.city}-
                            {enderecoAtual.state} - CEP:{" "}
                            {enderecoAtual.postcode}
                          </div>
                        </div>
                      </div>

                      <button
                        className="botaoMudarEndereco positiveButton"
                        onClick={() => {
                          document.body.style.overflow = "hidden";
                          setMudarEndereco("ativo");
                        }}
                      >
                        MUDAR
                      </button>
                    </S.ContainerEndereco>
                  </Col>
                </Row>
              )}

              <S.ContainerItemGeral>
                <S.ContainerItemBotoes>
                  {sellers &&
                    sellers.map((seller, index) => (
                      <div key={index}>
                        <Row>
                          <Col>
                            <S.remersa>
                              <h4>
                                Vendido e entregue por{" "}
                                <span
                                  onClick={() =>
                                    history.push(`/seller/${seller.url}`)
                                  }
                                >
                                  {seller.name}
                                </span>
                              </h4>
                            </S.remersa>
                          </Col>
                        </Row>

                        {seller.items &&
                          seller.items.map((product, productIndex) => (
                            <div key={productIndex}>
                              <ProductHorizontalBox
                                removeItem={removeItem}
                                handleQtd={handleQtd}
                                produto={product}
                              />
                            </div>
                          ))}
                        {shippings[index] ? (
                          <S.GeralContainer>
                            {shippings[index][1].length === 0 && (
                              <span
                                className="alertUnavailable"
                                ref={(ref) =>
                                  (refScrollShip.current[index] = ref)
                                }
                              >
                                <div className="Icon">
                                  <S.warningIcon />
                                </div>
                                Desculpa, esse lojista não faz entregas neste
                                CEP. Tente outra loja.
                              </span>
                            )}
                            <S.shipmentContainer>
                              {shippings[index][1].length !== 0 &&
                                selectCheck(+shippings[index][0]) && (
                                  <div
                                    className="shippingWarning"
                                    ref={(ref) =>
                                      (refScrollShip.current[index] = ref)
                                    }
                                  >
                                    <p>
                                      <S.Warning />
                                      Selecione um frete
                                    </p>
                                  </div>
                                )}
                              <Accordion className="accordion1">
                                <S.accordionContainer
                                  state={
                                    shippings[index][1].filter(
                                      (shipp) =>
                                        shipp.code !== "withdraw-in-store"
                                    ).length >= 1
                                      ? 1
                                      : 0.5
                                  }
                                  click={
                                    shippings[index][1].filter(
                                      (shipp) =>
                                        shipp.code !== "withdraw-in-store"
                                    ).length >= 1
                                      ? "initial"
                                      : "none"
                                  }
                                  selected={
                                    shippings[index][1].filter(
                                      (shipp) =>
                                        shipp.code !== "withdraw-in-store"
                                    ).length > 0 &&
                                    shippings[index][1]
                                      .filter(
                                        (shipp) =>
                                          shipp.code !== "withdraw-in-store"
                                      )
                                      .some(
                                        (i) => i.index === shipmentChoice[index]
                                      )
                                  }
                                >
                                  <div className="accordianBox">
                                    <Accordion.Toggle eventKey="0">
                                      <S.TruckIcon />
                                      {shippings[index][1].filter(
                                        (shipp) =>
                                          shipp.code !== "withdraw-in-store"
                                      ).length >= 1 ? (
                                        <></>
                                      ) : (
                                        <p>INDISPONÍVEL</p>
                                      )}
                                      <span className="pull-right">
                                        Receba em casa
                                      </span>
                                    </Accordion.Toggle>

                                    {+shippings[index][0] ===
                                      +seller.items[0].additional.seller_info
                                        .seller_id && (
                                      <div className="ContainerItem descricao">
                                        <Accordion.Collapse eventKey="0">
                                          <>
                                            <h4>Escolher uma transportadora</h4>
                                            {shippings[index][1]
                                              .filter(
                                                (shipp) =>
                                                  shipp.code !==
                                                  "withdraw-in-store"
                                              )
                                              .map((frete, i) => {
                                                return (
                                                  <div
                                                    className="shipmentBox"
                                                    key={i}
                                                  >
                                                    <section>
                                                      <input
                                                        type="radio"
                                                        checked={
                                                          selectCheck(
                                                            +shippings[index][0]
                                                          )
                                                            ? false
                                                            : shipmentChoice[
                                                                index
                                                              ] === frete.index
                                                            ? true
                                                            : false
                                                        }
                                                        onClick={() => {
                                                          setShipmentChoice({
                                                            ...shipmentChoice,

                                                            [index]:
                                                              frete.index,
                                                          });

                                                          saveShipping(
                                                            frete.index,
                                                            shippings[index][0]
                                                          );
                                                        }}
                                                      />
                                                      <div>
                                                        <h2>{frete.carrier}</h2>
                                                        <p>
                                                          Receba em até{" "}
                                                          {frete.delivery_time}{" "}
                                                          dias úteis
                                                        </p>
                                                      </div>
                                                    </section>
                                                    {frete.price > 0 ? (
                                                      <aside>
                                                        +
                                                        {currencyFormat(
                                                          frete.price
                                                        )}
                                                      </aside>
                                                    ) : (
                                                      <aside>
                                                        <>FRETE GRÁTIS</>
                                                      </aside>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                          </>
                                        </Accordion.Collapse>
                                      </div>
                                    )}
                                  </div>
                                </S.accordionContainer>

                                <S.accordionContainer
                                  state={
                                    shippings[index][1].filter(
                                      (shipp) =>
                                        shipp.code === "withdraw-in-store"
                                    ).length >= 1
                                      ? 1
                                      : 0.5
                                  }
                                  click={
                                    shippings[index][1].filter(
                                      (shipp) =>
                                        shipp.code === "withdraw-in-store"
                                    ).length >= 1
                                      ? "initial"
                                      : "none"
                                  }
                                  selected={
                                    shippings[index][1].filter(
                                      (shipp) =>
                                        shipp.code === "withdraw-in-store"
                                    ).length > 0 &&
                                    shippings[index][1].filter(
                                      (shipp) =>
                                        shipp.code === "withdraw-in-store"
                                    )[0]?.index === shipmentChoice[index]
                                      ? true
                                      : false
                                  }
                                >
                                  <div className="accordianBox">
                                    <Accordion.Toggle eventKey="2">
                                      <S.StoreIcon />
                                      {shippings[index][1].filter(
                                        (shipp) =>
                                          shipp.code === "withdraw-in-store"
                                      ).length >= 1 ? (
                                        <></>
                                      ) : (
                                        <p>INDISPONÍVEL</p>
                                      )}
                                      <span className="pull-right">
                                        Retirar na loja
                                      </span>
                                    </Accordion.Toggle>

                                    {+shippings[index][0] ===
                                      +seller.items[0].additional.seller_info
                                        .seller_id && (
                                      <div className="ContainerItem2">
                                        <Accordion.Collapse eventKey="2">
                                          <>
                                            <h4>Buscar na loja</h4>

                                            {shippings[index][1]
                                              .filter(
                                                (shipp) =>
                                                  shipp.code ===
                                                  "withdraw-in-store"
                                              )
                                              .map((frete, i) => {
                                                return (
                                                  <div
                                                    className="shipmentBox"
                                                    key={i}
                                                  >
                                                    <section>
                                                      <input
                                                        type="radio"
                                                        checked={
                                                          selectCheck(
                                                            +shippings[index][0]
                                                          )
                                                            ? false
                                                            : shipmentChoice[
                                                                index
                                                              ] === frete.index
                                                            ? true
                                                            : false
                                                        }
                                                        onClick={() => {
                                                          saveShipping(
                                                            frete.index,
                                                            shippings[index][0]
                                                          );

                                                          setShipmentChoice({
                                                            ...shipmentChoice,

                                                            [index]:
                                                              frete.index,
                                                          });
                                                        }}
                                                      />
                                                      <div>
                                                        <h2>{frete.carrier}</h2>
                                                        <p>
                                                          Receba em até{" "}
                                                          {frete.delivery_time}{" "}
                                                          dias úteis
                                                        </p>
                                                      </div>
                                                    </section>
                                                    {frete.price > 0 ? (
                                                      <aside>
                                                        +R${frete.price},00
                                                      </aside>
                                                    ) : (
                                                      <aside>
                                                        <>FRETE GRÁTIS</>
                                                      </aside>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                          </>
                                        </Accordion.Collapse>
                                      </div>
                                    )}
                                  </div>
                                </S.accordionContainer>
                              </Accordion>
                            </S.shipmentContainer>
                          </S.GeralContainer>
                        ) : (
                          ""
                        )}
                      </div>
                    ))}

                  {cart.items_qty && (
                    <div className="text-center">
                      <hr />
                      <br />

                      <button
                        onClick={handleClear}
                        className="limparCarrinho negativeButton"
                      >
                        LIMPAR CARRINHO
                      </button>
                      <button
                        onClick={() => history.push("/search")}
                        className="continuarComprando positiveButton"
                      >
                        CONTINUAR COMPRANDO
                      </button>
                    </div>
                  )}
                </S.ContainerItemBotoes>

                <S.ContainerTotaisGeral>
                  <S.total>
                    <h4>Resumo da compra</h4>
                    <div className="containerDados">
                      <p>
                        Produtos{" "}
                        <span>{currencyFormat(cart.base_sub_total)}</span>
                      </p>

                      {cart.shipping_total && (
                        <>
                          <p>
                            Frete{" "}
                            <span>{`+ ${currencyFormat(
                              cart.shipping_total.replaceAll(",", "")
                            )}`}</span>
                          </p>
                        </>
                      )}
                      {desconto && (
                        <div className="descontoBox">
                          <p>
                            Cupom:
                            <span className="cupomNome">
                              {cupom} <S.DeleteIcon onClick={removeDesconto} />
                            </span>
                          </p>
                          <p>
                            Desconto Cupom{" "}
                            <span>{`- ${currencyFormat(
                              cart.base_discount
                            )}`}</span>
                          </p>
                          <input
                            type="text"
                            disabled
                            placeholder="Possui um Cupom?"
                            value={cupom}
                            onChange={(e) => setCupom(e.target.value)}
                          />
                          <button
                            className="negativeButton"
                            onClick={removeDesconto}
                          >
                            REMOVER
                          </button>
                        </div>
                      )}

                      {cart.discount && !desconto && (
                        <>
                          <p>
                            Desconto{" "}
                            <span>{`- ${currencyFormat(cart.discount)}`}</span>
                          </p>
                        </>
                      )}
                      <p className="total">
                        Total <span>{currencyFormat(cart.grand_total)}</span>
                      </p>

                      {!desconto && (
                        <div className="descontoBox">
                          <input
                            type="text"
                            placeholder="Possui um Cupom?"
                            value={cupom}
                            onChange={(e) => setCupom(e.target.value)}
                          />
                          <button onClick={handleDesconto}>APLICAR</button>
                        </div>
                      )}
                    </div>
                    {gopayment &&
                    endereco &&
                    shippingselected &&
                    shippingAtual.length != 0 ? (
                      <GoCheckout
                        desabilitado={false}
                        reason={
                          endereco
                            ? shippingselected
                              ? "none"
                              : "ship"
                            : "address"
                        }
                        refScrollAddress={refScrollAddress}
                        refScrollShip={refScrollShip}
                      />
                    ) : (
                      <GoCheckout
                        desabilitado={true}
                        reason={
                          endereco
                            ? shippingselected
                              ? "none"
                              : "ship"
                            : "address"
                        }
                        refScrollAddress={refScrollAddress}
                        refScrollShip={refScrollShip}
                      />
                    )}
                  </S.total>
                </S.ContainerTotaisGeral>
                {cart.items_qty && (
                  <S.ContainerClearContinue>
                    <div className="text-center">
                      <hr />
                      <br />

                      <button
                        onClick={handleClear}
                        className="limparCarrinho negativeButton"
                      >
                        LIMPAR CARRINHO
                      </button>
                      <button
                        onClick={() => history.push("/search")}
                        className="continuarComprando positiveButton"
                      >
                        CONTINUAR COMPRANDO
                      </button>
                    </div>
                  </S.ContainerClearContinue>
                )}
              </S.ContainerItemGeral>
            </Container>
            <S.ContainerFooter></S.ContainerFooter>
          </S.produtos>
        </>
      ) : (
        <S.vazio>
          <h4>
            Seu carrinho está vazio vá para o catálogo para adicionar produtos
            <br />
            <br />
          </h4>

          <button
            onClick={() => history.push("/search")}
            style={{ padding: "10px 30px" }}
            className="positiveButton"
          >
            SEGUIR PARA O CATÁLOGO
          </button>
        </S.vazio>
      )}
      <ToastContainer />
    </>
  );
}

export default Cart;

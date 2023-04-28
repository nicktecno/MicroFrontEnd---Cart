import { useLang } from "../../Context/LangContext";
import { useCart } from "../../Context/CartLengthContext";
import { useLocation } from "../../Context/Location";

import api from "../../services/api";
import CartComponent from "./Cart";
import msLocation from "../../services/msLocation";

const Cart = () => {
  const { routeTranslations } = useLang();

  const { setCartLength } = useCart();
  const { AtualizarModalPagina, setAtualizarModalPagina } = useLocation();

  const mktName = process.env.NEXT_PUBLIC_REACT_APP_NAME;
  const appMsLocationUrl = process.env.NEXT_PUBLIC_REACT_APP_MS_LOCATION;
  const googleApiKey = process.env.NEXT_PUBLIC_REACT_APP_GOOGLE_MAPS_API_KEY;

  return (
    <>
      <meta
        name="kdt:page"
        content={`${process.env.NEXT_PUBLIC_REACT_APP_DESCRIPTION} - Carrinho`}
      />
      <title>{`${process.env.NEXT_PUBLIC_REACT_APP_TITLE} - Carrinho`}</title>
      <CartComponent
        mktName={mktName}
        api={api}
        msLocation={msLocation}
        routeTranslations={routeTranslations}
        setCartLength={setCartLength}
        AtualizarModalPagina={AtualizarModalPagina}
        setAtualizarModalPagina={setAtualizarModalPagina}
        appMsLocationUrl={appMsLocationUrl}
      />
    </>
  );
};

export default Cart;

import AppConfig from "config/appConfig";

const getDefaultCors = () => {
  const allowedOrigins = AppConfig.allowedOrigins ? AppConfig.allowedOrigins.split(",") : "*";

  return {
    origin: allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  };
};

export default getDefaultCors;

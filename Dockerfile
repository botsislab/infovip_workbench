### Build stage ###
FROM node:lts-alpine as build-stage
WORKDIR /app
# Doing this separately so that 'docker build' doesn't rebuild modules unless package.json has changed
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

### Production stage ###
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# docker run -p 80:80 --network=infovip infovip-workbench
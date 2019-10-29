FROM node:12-alpine
WORKDIR /app
COPY . /app
RUN cd /app && npm install
CMD ["npm", "start"]
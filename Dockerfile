FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build
RUN mkdir -p /data
ENV PORT=3000
ENV DATABASE_PATH=/data/swoopleague.db
EXPOSE 3000
CMD ["npm", "start"]

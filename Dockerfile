# Use a lightweight Nginx image
FROM nginx:alpine

# Copy custom Nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy all files from the current directory to the Nginx web root
# Since we are building from the .github.io directory which already contains the static files
COPY . /usr/share/nginx/html

# Expose port 80 to the host
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]

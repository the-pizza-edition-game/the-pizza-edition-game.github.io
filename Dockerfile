# Use a lightweight Nginx image
FROM nginx:alpine

# Copy custom Nginx configuration
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# Copy the built application
# We assume the build context is the project root and the app has been built to .output/public
COPY .output/public /usr/share/nginx/html

# Expose port 80 to the host
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]

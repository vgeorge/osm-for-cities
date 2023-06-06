FROM gitea/gitea:1.19.0
RUN apk update
RUN apk add rsync
COPY custom /custom
COPY start.sh /
ENTRYPOINT ["/bin/sh", "/start.sh"]
# CMD [ "/start.sh" ]

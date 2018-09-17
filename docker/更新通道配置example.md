### 更新通道配置

######  1. 启网络
```
./eyfn.sh down

./byfn.sh generate

./byfn.sh up
```
######  2. 对于cli容器，修改目录中的docker-compose-cli.yaml文件
```
cli:
  container_name: cli
  image: hyperledger/fabric-tools:$IMAGE_TAG
  tty: true
  stdin_open: true
  environment:
    - GOPATH=/opt/gopath
    - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
    #- CORE_LOGGING_LEVEL=INFO
    - CORE_LOGGING_LEVEL=DEBUG
```
######  3. 打开另一个终端，然后执行以下
1. 进入CLI容器
```
docker exec -it cli bash
```
2. 导出ORDERER_CA和CHANNEL_NAME变量：
```
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem  && export CHANNEL_NAME=mychannel
```
检查并确定已正确设置变量：
```
echo $ORDERER_CA && echo $CHANNEL_NAME
```

如果要重新启动cli容器，则需要再次导出两个环境变量：

```
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem  && export CHANNEL_NAME=mychannel
```

3.  提取最新配置块,将二进制protobuf通道配置块保存到 config_block.pb
```
peer channel fetch config config_block.pb -o orderer.example.com:7050 -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
```
4.  将配置转换为JSON并将其修剪下来
>使用该configtxlator工具将此通道配置块解码为JSON格式（可由人类读取和修改）。我们还必须删除与我们想要进行的更改无关的所有标头，元数据，创建者签名等。我们通过jq工具实现这一目标：

```
configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > config.json
```
查看生成的config.json 文件
```
less config.json
```
转换```config.json```为protobuf 的```config.pb```
```
configtxlator proto_encode --input config.json --type common.Config --output config.pb
```
5. 导出 ```MAXBATCHSIZEPATH```路径:
```
export MAXBATCHSIZEPATH=".channel_group.groups.Orderer.values.BatchSize.value.max_message_count"
```
查看```$MAXBATCHSIZEPATH```的值:
```
jq "$MAXBATCHSIZEPATH" config.json
```
会返回```10```
设置新的```max_message_count```值，并显示新值：
```
jq "$MAXBATCHSIZEPATH =20" config.json > modified_config.json
jq "$MAXBATCHSIZEPATH" modified_config.json
```
接下来，编码modified_config.json为modified_config.pb：
```
configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb
```
现在configtxlator用来计算这两个配置protobufs之间的增量。此命令将输出一个名为的新protobuf二进制文件org_update.pb:
```
configtxlator compute_update --channel_id $CHANNEL_NAME --original config.pb --updated modified_config.pb --output org_update.pb
```
将这个对象解码为可编辑的JSON格式并调用它org_update.json：
```
configtxlator proto_decode --input org_update.pb --type common.ConfigUpdate | jq . > org_update.json
```
现在，我们有一个解码的更新文件 - org_update.json我们需要包装一个信封消息。这一步将返回我们之前剥离的标题字段。我们将此文件命名为org_update_in_envelope.json：
```
echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":'$(cat org_update.json)'}}}' | jq . > org_update_in_envelope.json
```
使用我们正确构建的JSON - org_update_in_envelope.json我们将configtxlator最后一次利用该工具并将其转换为Fabric所需的完全成熟的protobuf格式。我们将命名我们的最终更新对象org_update_in_envelope.pb:
```
configtxlator proto_encode --input org_update_in_envelope.json --type common.Envelope --output org_update_in_envelope.pb
```
###### 6. 获取必要的签名

导出Org环境变量,以org的身份运行：
> You indeed need the orderer org admin signature. We changed the network-config to also include the admin and mspid information for the orderer and then used the admin to sign the config update:
<!-- ```
export CORE_PEER_LOCALMSPID="Org2MSP"

export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp

export CORE_PEER_ADDRESS=peer0.org2.example.com:7051
``` -->
```
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt
export CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key
export CORE_PEER_LOCALMSPID=OrdererMSP
export CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/users/Admin@example.com/msp
```
获取签名：
```
peer channel signconfigtx -f org_update_in_envelope.pb
```

###### 7. 提交配置更新

发送更新电话：

```
peer channel update -f org_update_in_envelope.pb -c $CHANNEL_NAME -o orderer.example.com:7050 --tls --cafile $ORDERER_CA
```
如果您的更新已成功提交，您应该会看到类似于以下内容的消息摘要指示：
```
2018-02-24 18:56:33.499 UTC [msp/identity] Sign -> DEBU 00f Sign: digest: 3207B24E40DE2FAB87A2E42BC004FEAA1E6FDCA42977CB78C64F05A88E556ABA
```
您还将看到我们的配置事务的提交：
```
2018-02-24 18:56:33.499 UTC [channelCmd] update -> INFO 010 Successfully submitted channel update
```
更改完之后，配置文件就会在各个org上同步更新。

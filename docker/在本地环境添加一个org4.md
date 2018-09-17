### 在通道内添加一个org6

将测试环境中的```yaml```和```point7```文件下载到本地
```
scp -r ubuntu@10.0.1.198:~/hyperledger/yaml ./

scp -r ubuntu@10.0.1.198:/home/ubuntu/gopath/src/point7 ./
```
默认已经下载```crytope```工具。

###### 1. 在```yaml```文件中新建```org6-artifacts```文件夹。进入```org6-artifacts```下，新建以下两个文件。
```
cd yaml
mkdir org6-artifacts
```

configtx.yaml:
```
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

---
################################################################################
#
#   Section: Organizations
#
#   - This section defines the different organizational identities which will
#   be referenced later in the configuration.
#
################################################################################
Organizations:
    - &Org6
        # DefaultOrg defines the organization which is used in the sampleconfig
        # of the fabric.git development environment
        Name: Org6MSP

        # ID to load the MSP definition as
        ID: Org6MSP

        MSPDir: crypto-config/peerOrganizations/org6.daotech.io/msp

        AnchorPeers:
            # AnchorPeers defines the location of peers which can be used
            # for cross org gossip communication.  Note, this value is only
            # encoded in the genesis block in the Application section context
            - Host: peer0.org6.daotech.io
              Port: 7051
```

org6-crypto.yaml:
```
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# ---------------------------------------------------------------------------
# "PeerOrgs" - Definition of organizations managing peer nodes
# ---------------------------------------------------------------------------
PeerOrgs:
  # ---------------------------------------------------------------------------
  # Org6
  # ---------------------------------------------------------------------------
  - Name: Org6
    Domain: org6.daotech.io
    EnableNodeOUs: true
    Template:
      Count: 2
    Users:
      Count: 1
```

###### 2. 生成Org6密钥和证书

```
cd org6-artifacts
../bin/cryptogen generate --config=./org6-crypto.yaml
```
在```org6-artifacts```目录下会生成```crypto-config```文件。

###### 3.  告诉工具在当前目录中查找configtx.yaml，并生成一个的json文件
json文件中包含org6的策略定义，以及org6的三个重要证书的信息：管理员用户证书，CA根证书和TLS根目录证书。
```
export FABRIC_CFG_PATH=$PWD && ../bin/configtxgen -printOrg Org6MSP > ../channel-artifacts/org6.json
```

###### 4. 将Orderer Org的MSP材料放到Org6的 crypto-config目录中
```
cd ../ && cp -r crypto-config/ordererOrganizations org6-artifacts/crypto-config/
```
Orderer的TLS根证书，它将允许Org6实体与网络订购节点之间的安全通信。

###### 5. 准备cli环境
1. 在本地起一个cli容器
```
docker run --name cli -e GOPATH=/opt/gopath \
-e CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock \
-e CORE_LOGGING_LEVEL=DEBUG -e CORE_PEER_ID=cli \
-e CORE_PEER_ADDRESS=peer0.org1.daotech.io:7051 \
-e CORE_PEER_LOCALMSPID=Org1MSP -e CORE_PEER_TLS_ENABLED=true \
-e CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.daotech.io/peers/peer0.org1.daotech.io/tls/server.crt \
-e CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.daotech.io/peers/peer0.org1.daotech.io/tls/server.key \
-e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.daotech.io/peers/peer0.org1.daotech.io/tls/ca.crt \
-e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.daotech.io/users/Admin@org1.daotech.io/msp \
-v  /var/run/:/host/var/run/ \
-v /Users/lanc/point7:/opt/gopath/src/github.com/chaincode \
-v /Users/lanc/yaml/crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ \
-v /Users/lanc/fabric-samples/first-network/scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/ \
-v /Users/lanc/yaml/channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts \
--network=host  \
--tty=true \
-d hyperledger/fabric-tools /bin/bash

```

在自己的本机添加host:

```
cd /etc
sudo vi hosts
```
然后在```hosts```文件中添加：
```
10.0.1.198 peer0.org1.daotech.io  orderer0.daotech.io
```
2. 进入CLI容器
```
docker exec -it cli bash
cd /opt/gopath/src/github.com/hyperledger/fabric/peer/
```
3. 导出ORDERER_CA和CHANNEL_NAME变量：
```
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/daotech.io/orderers/orderer0.daotech.io/msp/tlscacerts/tlsca.daotech.io-cert.pem  && export CHANNEL_NAME=daotechio
```
检查并确定已正确设置变量：
```
echo $ORDERER_CA && echo $CHANNEL_NAME
```

如果要重新启动cli容器，则需要再次导出两个环境变量：

```
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/daotech.io/orderers/orderer0.daotech.io/msp/tlscacerts/tlsca.daotech.io-cert.pem  && export CHANNEL_NAME=daotechio
```

###### 6. 获取配置
提取最新配置块,将二进制protobuf通道配置块保存到 config_block.pb
```
peer channel fetch config config_block.pb -o orderer0.daotech.io:7050 -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
```
###### 7. 将配置转换为JSON并将其修剪下来
>使用该configtxlator工具将此通道配置块解码为JSON格式。我们还必须删除与我们想要进行的更改无关的所有标头，元数据，创建者签名等。我们通过jq工具实现这一目标：

```
configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > config.json
```
查看生成的config.json 文件
```
less config.json
```

###### 8. 添加Org6加密文件
We’ll use the jq tool once more to append the Org6 configuration definition – org6.json – to the channel’s application groups field, and name the output – modified_config.json.
```
jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"Org6MSP":.[1]}}}}}' config.json ./channel-artifacts/org6.json > modified_config.json
```
现在，在CLI容器中，我们有两个JSON文件 - config.json 和modified_config.json。重新编码这两个JSON文件并计算增量。

转换config.json为protobuf 的config.pb
```
configtxlator proto_encode --input config.json --type common.Config --output config.pb
```
编码modified_config.json为modified_config.pb
```
configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb
```
用configtxlator计算这两个配置protobufs之间的增量。此命令将输出二进制文件org6_update.pb：
```
configtxlator compute_update --channel_id $CHANNEL_NAME --original config.pb --updated modified_config.pb --output org6_update.pb
```

将这个org6_update.pb对象解码为JSON格式并调用org6_update.json：
```
configtxlator proto_decode --input org6_update.pb --type common.ConfigUpdate | jq . > org6_update.json
```
给```org6_update.json```添加标题字段,输出到```org6_update_in_envelope.json```：
```
echo '{"payload":{"header":{"channel_header":{"channel_id":"daotechio", "type":2}},"data":{"config_update":'$(cat org6_update.json)'}}}' | jq . > org6_update_in_envelope.json
```
利用configtxlator工具将```org6_update_in_envelope.json```转换为Fabric所需的protobuf格式。
```
configtxlator proto_encode --input org6_update_in_envelope.json --type common.Envelope --output org6_update_in_envelope.pb
```
###### 9. 签名并提交配置更新
Org1管理员签名
```
peer channel signconfigtx -f org6_update_in_envelope.pb
```
设置Org2环境，以Org2 Admin用户运行：
```
export CORE_PEER_LOCALMSPID="Org2MSP"

export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.daotech.io/peers/peer0.org2.daotech.io/tls/ca.crt

export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.daotech.io/users/Admin@org2.daotech.io/msp

export CORE_PEER_ADDRESS=peer0.org2.daotech.io:7051
```

Org2 管理员签名：
```
peer channel signconfigtx -f org6_update_in_envelope.pb
```

环境中有几个peer，就需要几个peer的签名，设置Org3的环境变量，以Org3 Admin用户运行，同上。
如果报```got unexpected status: BAD_REQUEST -- error authorizing update: error validating DeltaSet: policy for [Group] /Channel/Application not satisfied: Failed to reach implicit threshold of 4 sub-policies, required 1 remaining```,就是签名的人数还不够。之前有同步的节点，在服务器上没有同步过去，要把本地启的节点的证书放到服务器对应的配置文件中。如```cp -r /Users/lanc/yaml/org5-artifacts/crypto-config/peerOrganizations/org5.daotech.io org5.daotech.io```。(在```/Users/lanc/yaml/crypto-config/peerOrganizations```目录下)。

```
export CORE_PEER_LOCALMSPID="Org3MSP"

export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.daotech.io/peers/peer0.org3.daotech.io/tls/ca.crt

export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.daotech.io/users/Admin@org3.daotech.io/msp

export CORE_PEER_ADDRESS=peer0.org3.daotech.io:7051
```
Org3 管理员签名：
```
peer channel signconfigtx -f org6_update_in_envelope.pb
```
然后发送更新请求：
```
peer channel update -f org6_update_in_envelope.pb -c $CHANNEL_NAME -o orderer0.daotech.io:7050 --tls --cafile $ORDERER_CA
```
如果您的更新已成功提交，您应该会看到类似于以下内容的消息摘要指示：
```
2018-02-24 18:56:33.499 UTC [msp/identity] Sign -> DEBU 00f Sign: digest: 3207B24E40DE2FAB87A2E42BC004FEAA1E6FDCA42977CB78C64F05A88E556ABA

2018-02-24 18:56:33.499 UTC [channelCmd] update -> INFO 010 Successfully submitted channel update

```

###### 10. Configuring Leader Election
1. To utilize static leader mode, configure the peer to be an organization leader:

```
CORE_PEER_GOSSIP_USELEADERELECTION=false
CORE_PEER_GOSSIP_ORGLEADER=true
```
2. To utilize dynamic leader election, configure the peer to use leader election:

```
CORE_PEER_GOSSIP_USELEADERELECTION=true
CORE_PEER_GOSSIP_ORGLEADER=false
```
>建议使用dynamic leader election
Because peers of the newly added organization won’t be able to form membership view, this option will be similar to the static configuration, as each peer will start proclaiming itself to be a leader. However, once they get updated with the configuration transaction that adds the organization to the channel, there will be only one active leader for the organization. Therefore, it is recommended to leverage this option if you eventually want the organization’s peers to utilize leader election.

###### 11. 将Org6加入channel
打开一个新的端口
1.启动org6cli容器：

在```yaml```目录下，新建```docker-compose-org6.yaml```文件。

docker-compose-org6.yaml：
```
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

version: '2'

volumes:
  peer0.org6.daotech.io:
  peer1.org6.daotech.io:

networks:
  host:

services:

  peer0.org6.daotech.io:
    container_name: peer0.org6.daotech.io
    extends:
      file: base/peer-base.yaml
      service: peer-base
    environment:
      - CORE_PEER_ID=peer0.org6.daotech.io
      - CORE_PEER_ADDRESS=peer0.org6.daotech.io:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.org6.daotech.io:7051
      - CORE_PEER_LOCALMSPID=Org6MSP
    volumes:
        - /var/run/:/host/var/run/
        - ./org6-artifacts/crypto-config/peerOrganizations/org6.daotech.io/peers/peer0.org6.daotech.io/msp:/etc/hyperledger/fabric/msp
        - ./org6-artifacts/crypto-config/peerOrganizations/org6.daotech.io/peers/peer0.org6.daotech.io/tls:/etc/hyperledger/fabric/tls
        - /tmp/p0:/var/hyperledger/production
    ports:
      - 11051:7051
      - 11053:7053
    networks:
      - host

  peer1.org6.daotech.io:
    container_name: peer1.org6.daotech.io
    extends:
      file: base/peer-base.yaml
      service: peer-base
    environment:
      - CORE_PEER_ID=peer1.org6.daotech.io
      - CORE_PEER_ADDRESS=peer1.org6.daotech.io:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer1.org6.daotech.io:7051
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.org6.daotech.io:7051
      - CORE_PEER_LOCALMSPID=Org6MSP
    volumes:
        - /var/run/:/host/var/run/
        - ./org6-artifacts/crypto-config/peerOrganizations/org6.daotech.io/peers/peer1.org6.daotech.io/msp:/etc/hyperledger/fabric/msp
        - ./org6-artifacts/crypto-config/peerOrganizations/org6.daotech.io/peers/peer1.org6.daotech.io/tls:/etc/hyperledger/fabric/tls
        - /tmp/p1:/var/hyperledger/production
    ports:
      - 12051:7051
      - 12053:7053
    networks:
      - host


  Org6cli:
    container_name: Org6cli
    image: hyperledger/fabric-tools:latest
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      # - CORE_LOGGING_LEVEL=INFO
      - CORE_LOGGING_LEVEL=DEBUG
      - CORE_PEER_ID=Org6cli
      - CORE_PEER_ADDRESS=peer0.org6.daotech.io:7051
      - CORE_PEER_LOCALMSPID=Org6MSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org6.daotech.io/peers/peer0.org6.daotech.io/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org6.daotech.io/peers/peer0.org6.daotech.io/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org6.daotech.io/peers/peer0.org6.daotech.io/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org6.daotech.io/users/Admin@org6.daotech.io/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
        - /var/run/:/host/var/run/
        - ./../point7/:/opt/gopath/src/github.com/chaincode
        - ./org6-artifacts/crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
        - ./crypto-config/peerOrganizations/org1.daotech.io:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.daotech.io
        - ./crypto-config/peerOrganizations/org2.daotech.io:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.daotech.io
        - ./crypto-config/peerOrganizations/org3.daotech.io:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.daotech.io
        - ./scripts:/opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/
    depends_on:
      - peer0.org6.daotech.io
      - peer1.org6.daotech.io
    networks:
      - host

```
然后执行：
```
docker-compose -f docker-compose-org6.yaml up -d
```

2. 进入Org6的CLI容器：
```
docker exec -it Org6cli bash
```
3. 设置两个关键环境变量：ORDERER_CA和CHANNEL_NAME
```
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/daotech.io/orderers/orderer0.daotech.io/msp/tlscacerts/tlsca.daotech.io-cert.pem && export CHANNEL_NAME=daotechio
```
4. 检查以确保已正确设置变量：
```
echo $ORDERER_CA && echo $CHANNEL_NAME
```
5. 现在让我们打电话给订购服务，询问创世块 daotechio。由于我们成功的频道更新，订购服务能够验证附加到此呼叫的Org6签名。如果Org6尚未成功附加到通道配置，则订购服务应拒绝此请求。
>Notice, that we are passing a 0 to indicate that we want the first block on the channel’s ledger (i.e. the genesis block). If we simply passed the peer channel fetch config command, then we would have received block 5 – the updated config with Org6 defined. However, we can’t begin our ledger with a downstream block – we must start with block 0.

```
peer channel fetch 0 daotechio.block -o orderer0.daotech.io:7050 -c $CHANNEL_NAME --tls --cafile $ORDERER_CA
```
6. Issue the ```peer channel join ```command and pass in the genesis block – ```daotechio.block```:

```
peer channel join -b daotechio.block
```
加入成功后你会看到如下内容：
```
2018-08-30 06:40:57.093 UTC [msp/identity] Sign -> DEBU 040 Sign: digest: 18086F45E761274E2917054DB293B89ACEE4220241DDCC0EB2D6EC30603EA2CD
2018-08-30 06:40:57.176 UTC [channelCmd] executeJoin -> INFO 041 Successfully submitted proposal to join channel
```
7. 如果要加入Org6的second peer：

设置Org6的second peer的环境变量：
```
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org6.daotech.io/peers/peer1.org6.daotech.io/tls/ca.crt

export CORE_PEER_ADDRESS=peer1.org6.daotech.io:7051
```
加入```daotechio.block```
```
peer channel join -b daotechio.block
```
###### 12. 升级和触发Chaincode
进入Org的CLI容器，设置org1的环境变量:

```
export CORE_PEER_LOCALMSPID="Org1MSP"

export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.daotech.io/peers/peer0.org1.daotech.io/tls/ca.crt

export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.daotech.io/users/Admin@org1.daotech.io/msp

export CORE_PEER_ADDRESS=peer0.org1.daotech.io:7051
```
复制chaincode:

```
cd /opt/gopath/src/github.com/chaincode
cp -r point10 point11
```

然后安装：

```
peer chaincode install -n point -v v11 -p github.com/chaincode/point11/
```
发送更新请求:

```
peer chaincode upgrade -o orderer0.daotech.io:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n point -v v11 -c '{"Args":["init","test"]}' -P "OR ('Org1MSP.peer')"
```
区块上的数据就会同步到```/tmp/p0```目录下。

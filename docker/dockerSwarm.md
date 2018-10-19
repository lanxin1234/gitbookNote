## Docker Swarm 入门：单机创建 Swarm 集群
指令：docker swarm init
###### 使用 Docker Machine 创建虚拟机
 1. 使用 Docker Machine 创建虚拟机
 <a href='https://www.jianshu.com/p/3251f2991d5c'>下载 boot2docker.iso 镜像</a>

###### Docker Swarm 入门：节点管理
参考链接： <a href='https://www.jianshu.com/p/48dd5fff7150'>节点管理</a>
1. 查看当前集群节点列表
```
docker node ls
```
结果：
```
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
3fff9l59dvn5jvot2s27gf9n2 *   ManagerX            Ready               Active              Leader
4byjmtcm1ag8qffxjwnhwsf4l     WorkerA             Ready               Active
sks1qb0zqlaetmpsqfj5tfx56     WorkerB             Ready               Active
```
AVAILABILITY 的三种状态：

- Active：调度器能够安排任务到该节点
- Pause：调度器不能够安排任务到该节点，但是已经存在的任务会继续运行
- Drain：调度器不能够安排任务到该节点，而且会停止已存在的任务，并将这些任务分配到其他 Active 状态的节点

MANAGER STATUS 的三种状态

- Leader：为群体做出所有群管理和编排决策的主要管理者节点
- Reachable：如果 Leader 节点变为不可用，该节点有资格被选举为新的 Leader
- Unavailable：该节点不能和其他 Manager 节点产生任何联系，这种情况下，应该添加一个新的 Manager 节点到集群，或者将一个 Worker 节点提升为 Manager 节点

2. 更新节点

改变节点的可用性(availability)，示例
```
docker node update  --availability drain WorkerA
```
添加/移除标签元数据，示例
```
docker node update --label-add foo --label-add bar=baz WorkerA
```
- 类型一：--label-add <key>
- 类型二：--label-add <key>=<value>
升级/降级节点，示例
```
[升级] docker node promote WorkerA
```
```
[降级] docker node demote WorkerA
```

<a href='https://www.jianshu.com/p/9576edc0659e'>Mac下安装VirtualBox</a>

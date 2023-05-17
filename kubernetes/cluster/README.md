# Terrafor Cluster for osm-for-cities

This is a Terraform template that allows you to create a cluster in EKS. eks_blueprints have been used for this template. The cluster includes actions to initialize an EBS with a Persistent Volume claim, an EFS that requires a Persistent Volume and a Persistent Volume claim. It also has auto-scaling capability and an ELB.

## Deploy

```sh
terraform init
terraform plan
terraform apply -auto-approve
```

## Add admin users

The admin users need to be added to the "configmap/aws-auth" in the "mapUsers" section.

```sh
kubectl describe configmap -n kube-system aws-auth
kubectl edit configmap -n kube-system aws-auth
```
Add user's ARN:

```yaml
mapUsers:
----
- groups:
  - system:masters
  userarn: arn:aws:iam::670119057264:user/argos
  username: argos
```

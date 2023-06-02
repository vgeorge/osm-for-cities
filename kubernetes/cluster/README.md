# Terrafor Cluster for osm-for-cities

This is a Terraform template that allows you to create a cluster in EKS. eks_blueprints have been used for this template. The cluster includes actions to initialize an EBS with a Persistent Volume claim, an EFS that requires a Persistent Volume and a Persistent Volume claim. It also has auto-scaling capability and an ELB.

## Deploy developement


```sh
terraform init
terraform plan -var-file=variables.dev.tfvars 
terraform apply -var-file=variables.dev.tfvars -state=terraform.dev.tfstate -auto-approve
# terraform destroy -var-file=variables.dev.tfvars -state=terraform.dev.tfstate
```
* At the initial deployment, disable EBS Add-ons in `kubernetes-addons.tf`, and subsequently enable them to update the cluster.

## Deploy production


```sh
terraform init
terraform plan -var-file=variables.prod.tfvars 
terraform apply -var-file=variables.prod.tfvars -backend-config=backend.prod.tf -auto-approve
# terraform destroy -var-file=variables.prod.tfvars -state=terraform.prod.tfstate
```

## Add admin users

The admin users need to be added to the "configmap/aws-auth" in the "mapUsers" section.

```sh
aws sts get-caller-identity
# kubectl get configmap -n kube-system aws-auth -o yaml
kubectl describe configmap -n kube-system aws-auth
kubectl edit configmap -n kube-system aws-auth
```
Add user's ARN, from: 👇

```yaml
  mapUsers: |
    []
```

to: 👇

```yaml
  mapUsers: |
    - userarn: arn:aws:iam::12345678912:user/ofc-deploy
      username: ofc-deploy
      groups:
        - system:masters
    - userarn: arn:aws:iam::12345678912:user/Vito
      username: Vito
      groups:
        - system:masters
```

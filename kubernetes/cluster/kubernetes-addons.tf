module "kubernetes_addons" {
  source = "github.com/aws-ia/terraform-aws-eks-blueprints//modules/kubernetes-addons?ref=v4.25.0"

  eks_cluster_id = module.eks_blueprints.eks_cluster_id

  # EKS Add-ons
  enable_amazon_eks_aws_ebs_csi_driver = true
  amazon_eks_aws_ebs_csi_driver_config = {
    addon_name               = "aws-ebs-csi-driver"
    service_account          = "ebs-csi-controller-sa"
    resolve_conflicts        = "OVERWRITE"
    namespace                = "kube-system"
    timeout                  = "600"
    additional_iam_policies  = []
    service_account_role_arn = ""
    # tags                     = {}
    tags = var.tags
  }

  enable_aws_efs_csi_driver = true
  # aws_efs_csi_driver_helm_config = {
  #   version   = "2.2.6"
  #   namespace = "kube-system"
  # }
  enable_cluster_autoscaler = true
  tags                      = var.tags
}

provider "helm" {
  kubernetes {
    host                   = module.eks_blueprints.eks_cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks_blueprints.eks_cluster_certificate_authority_data)

    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks_blueprints.eks_cluster_id]
    }
  }
}
module "kubernetes_addons" {
  source = "github.com/aws-ia/terraform-aws-eks-blueprints//modules/kubernetes-addons?ref=v4.25.0"

  eks_cluster_id = module.eks_blueprints.eks_cluster_id

  # EBS Add-ons
  enable_amazon_eks_aws_ebs_csi_driver = true
  amazon_eks_aws_ebs_csi_driver_config = {
    addon_name               = "aws-ebs-csi-driver"
    service_account          = "ebs-csi-controller-sa"
    resolve_conflicts        = "OVERWRITE"
    namespace                = "kube-system"
    timeout                  = "600"
    additional_iam_policies  = []
    service_account_role_arn = ""
    tags                     = var.tags
  }
  # EFS Add-ons
  enable_aws_efs_csi_driver = true
  aws_efs_csi_driver_helm_config = {
    version   = "2.2.6"
    namespace = "kube-system"
  }

  enable_cluster_autoscaler           = true
  enable_aws_load_balancer_controller = true
  enable_metrics_server               = true
  enable_cert_manager                 = true

  tags = var.tags
}